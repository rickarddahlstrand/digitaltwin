extends CanvasLayer
## HUD overlay showing coordinates, layer toggles, and loading status.

var _coord_label: Label
var _status_label: Label
var _layer_panel: VBoxContainer


func _ready() -> void:
	_build_ui()


func _process(_delta: float) -> void:
	_update_coordinates()


func _build_ui() -> void:
	# Top-left: coordinates
	_coord_label = Label.new()
	_coord_label.position = Vector2(16, 16)
	_coord_label.text = "Lat: --  Lon: --"
	_coord_label.add_theme_font_size_override("font_size", 16)
	_coord_label.add_theme_color_override("font_color", Color.WHITE)
	_coord_label.add_theme_color_override("font_shadow_color", Color.BLACK)
	_coord_label.add_theme_constant_override("shadow_offset_x", 1)
	_coord_label.add_theme_constant_override("shadow_offset_y", 1)
	add_child(_coord_label)

	# Top-right: status
	_status_label = Label.new()
	_status_label.anchor_left = 1.0
	_status_label.anchor_right = 1.0
	_status_label.position = Vector2(-200, 16)
	_status_label.size = Vector2(184, 30)
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_status_label.text = "Tiles: Loading..."
	_status_label.add_theme_font_size_override("font_size", 14)
	_status_label.add_theme_color_override("font_color", Color(0.8, 0.9, 1.0))
	_status_label.add_theme_color_override("font_shadow_color", Color.BLACK)
	_status_label.add_theme_constant_override("shadow_offset_x", 1)
	_status_label.add_theme_constant_override("shadow_offset_y", 1)
	add_child(_status_label)

	# Bottom-left: layer toggles
	var panel := PanelContainer.new()
	panel.anchor_top = 1.0
	panel.anchor_bottom = 1.0
	panel.position = Vector2(16, -160)
	panel.size = Vector2(200, 140)
	add_child(panel)

	_layer_panel = VBoxContainer.new()
	panel.add_child(_layer_panel)

	var title := Label.new()
	title.text = "Data Layers"
	title.add_theme_font_size_override("font_size", 14)
	_layer_panel.add_child(title)

	_add_layer_toggle("3D Tiles", true)
	_add_layer_toggle("POI Markers", true)


func _add_layer_toggle(label_text: String, default_on: bool) -> void:
	var toggle := CheckButton.new()
	toggle.text = label_text
	toggle.button_pressed = default_on
	toggle.toggled.connect(_on_layer_toggled.bind(label_text))
	_layer_panel.add_child(toggle)


func _on_layer_toggled(enabled: bool, layer_name: String) -> void:
	match layer_name:
		"3D Tiles":
			var tileset := get_tree().get_first_node_in_group("cesium_tileset")
			if tileset:
				tileset.visible = enabled
		"POI Markers":
			var poi_container := get_tree().get_first_node_in_group("poi_container")
			if poi_container:
				poi_container.visible = enabled


func _update_coordinates() -> void:
	var camera := get_viewport().get_camera_3d()
	if camera == null:
		return

	var pos := camera.global_position
	var georeference := get_tree().get_first_node_in_group("cesium_georeference")

	if georeference:
		# Local tangent plane approximation from georeference origin.
		# In CartographicOrigin mode: X=east, Y=up, Z=south
		var origin_lat: float = georeference.latitude
		var origin_lon: float = georeference.longitude
		var origin_alt: float = georeference.altitude

		var meters_per_deg_lat := 111320.0
		var meters_per_deg_lon := 111320.0 * cos(deg_to_rad(origin_lat))

		var lat := origin_lat - pos.z / meters_per_deg_lat
		var lon := origin_lon + pos.x / meters_per_deg_lon
		var alt := origin_alt + pos.y

		_coord_label.text = "Lat: %.4f  Lon: %.4f  Alt: %.0fm" % [lat, lon, alt]
	else:
		_coord_label.text = "Pos: %.1f, %.1f, %.1f" % [pos.x, pos.y, pos.z]


func set_status(text: String) -> void:
	if _status_label:
		_status_label.text = text
