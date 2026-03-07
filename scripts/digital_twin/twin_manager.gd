extends Node
## Central manager for the digital twin.
## Configures 3D tiles, manages data layers and POIs.

@onready var poi_container: Node3D = $POIContainer
@onready var data_layer_container: Node3D = $DataLayerContainer

# Hammarby Sjöstad coordinates
const ORIGIN_LAT := 59.302
const ORIGIN_LON := 18.088
const ORIGIN_HEIGHT := 500.0

# Test POIs in Hammarby Sjöstad
const TEST_POIS := [
	{"name": "Sjöstadsparterren", "lat": 59.3035, "lon": 18.0910, "height": 30.0},
	{"name": "Hammarby Sjöstads Kaj", "lat": 59.3010, "lon": 18.0850, "height": 25.0},
	{"name": "Luma Park", "lat": 59.3055, "lon": 18.0930, "height": 35.0},
]


func _ready() -> void:
	_setup_tileset()
	_setup_camera()


func _setup_tileset() -> void:
	var url := AppConfig.get_tileset_url()
	if url.is_empty():
		push_warning("TwinManager: No tileset URL available. Set GOOGLE_MAPS_API_KEY env var.")
		return

	var georeference := _find_georeference()
	if georeference:
		print("TwinManager: origin lat=%.4f lon=%.4f alt=%.1f" % [
			georeference.latitude, georeference.longitude, georeference.altitude])

	var tileset := _find_tileset()
	if tileset == null:
		push_error("TwinManager: Cesium3DTileset not found in scene")
		return

	tileset.data_source = 1  # FromUrl
	tileset.url = url
	tileset.show_hierarchy = false
	tileset.generate_missing_normals_smooth = true
	tileset.create_physics_meshes = false
	tileset.maximum_screen_space_error = 8.0
	print("TwinManager: Tileset configured with URL")


func _setup_camera() -> void:
	var camera := get_viewport().get_camera_3d()
	if camera == null:
		print("TwinManager: No camera found!")
		return

	var georeference := _find_georeference()
	var tileset := _find_tileset()

	if georeference and "globe_node" in camera:
		camera.globe_node = georeference
	if tileset and "tilesets" in camera:
		camera.tilesets.append(tileset)

	# The plugin uses "rotated ECEF" space where surface normal defines "up".
	# Position camera along the local surface normal (not Godot Y-up).
	if georeference:
		var ecef_origin := Vector3(georeference.ecefX, georeference.ecefY, georeference.ecefZ)
		var surface_up: Vector3 = georeference.get_normal_at_surface_pos(ecef_origin)
		camera.global_position = surface_up * 500.0
		print("TwinManager: Camera at %s, surface_up=%s" % [
			str(camera.global_position), str(surface_up)])
	else:
		camera.global_position = Vector3(0, 300, 100)


func _spawn_test_pois() -> void:
	for poi_data in TEST_POIS:
		var marker := preload("res://scripts/digital_twin/poi_marker.gd").new()
		marker.poi_name = poi_data["name"]
		marker.latitude = poi_data["lat"]
		marker.longitude = poi_data["lon"]
		marker.altitude = poi_data["height"]
		poi_container.add_child(marker)
		marker.place_at_coordinates()


func _find_georeference() -> Node:
	return get_tree().get_first_node_in_group("cesium_georeference") if get_tree() else null


func _find_tileset() -> Node:
	return get_tree().get_first_node_in_group("cesium_tileset") if get_tree() else null


## Convert geographic coordinates (lat/lon/alt) to local engine position.
func geo_to_local(lat: float, lon: float, height: float) -> Vector3:
	var georeference := _find_georeference()
	if georeference and georeference.has_method("lat_lon_alt_rad_to_ecef"):
		var lat_rad := deg_to_rad(lat)
		var lon_rad := deg_to_rad(lon)
		var ecef: Vector3 = georeference.lat_lon_alt_rad_to_ecef(Vector3(lat_rad, lon_rad, height))
		return georeference.get_tx_ecef_to_engine() * ecef

	var lat_diff := lat - ORIGIN_LAT
	var lon_diff := lon - ORIGIN_LON
	var meters_per_deg_lat := 111320.0
	var meters_per_deg_lon := 111320.0 * cos(deg_to_rad(ORIGIN_LAT))
	return Vector3(
		lon_diff * meters_per_deg_lon,
		height,
		-lat_diff * meters_per_deg_lat
	)


func add_data_layer(layer: Node) -> void:
	data_layer_container.add_child(layer)


func remove_data_layer(layer: Node) -> void:
	if layer.get_parent() == data_layer_container:
		data_layer_container.remove_child(layer)
		layer.queue_free()


func get_data_layers() -> Array[Node]:
	var layers: Array[Node] = []
	for child in data_layer_container.get_children():
		layers.append(child)
	return layers
