class_name POIMarker
extends Node3D
## A georeferenced point-of-interest marker with 3D mesh, label and click interaction.

@export var poi_name: String = "POI"
@export var latitude: float = 0.0
@export var longitude: float = 0.0
@export var altitude: float = 0.0
@export var marker_color: Color = Color(0.2, 0.6, 1.0)

var _mesh_instance: MeshInstance3D
var _label: Label3D
var _collision_area: Area3D

signal poi_clicked(marker: POIMarker)


func _ready() -> void:
	_create_mesh()
	_create_label()
	_create_collision()


func place_at_coordinates() -> void:
	var twin_manager := _get_twin_manager()
	if twin_manager:
		position = twin_manager.geo_to_local(latitude, longitude, altitude)


func _create_mesh() -> void:
	_mesh_instance = MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 3.0
	sphere.height = 6.0
	_mesh_instance.mesh = sphere

	var material := StandardMaterial3D.new()
	material.albedo_color = marker_color
	material.emission_enabled = true
	material.emission = marker_color
	material.emission_energy_multiplier = 0.5
	_mesh_instance.material_override = material

	add_child(_mesh_instance)


func _create_label() -> void:
	_label = Label3D.new()
	_label.text = poi_name
	_label.font_size = 48
	_label.position = Vector3(0, 8, 0)
	_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_label.no_depth_test = true
	_label.modulate = Color.WHITE
	add_child(_label)


func _create_collision() -> void:
	_collision_area = Area3D.new()
	var collision_shape := CollisionShape3D.new()
	var shape := SphereShape3D.new()
	shape.radius = 5.0
	collision_shape.shape = shape
	_collision_area.add_child(collision_shape)
	_collision_area.input_event.connect(_on_input_event)
	add_child(_collision_area)


func _on_input_event(_camera: Node, event: InputEvent, _position: Vector3, _normal: Vector3, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		poi_clicked.emit(self)
		print("POI clicked: %s (%.4f, %.4f)" % [poi_name, latitude, longitude])


func _get_twin_manager() -> Node:
	return get_tree().get_first_node_in_group("twin_manager") if get_tree() else null
