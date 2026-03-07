class_name DataLayer
extends Node3D
## Base class for geographic data overlays.
## Extend this class to create custom data visualizations.

@export var layer_name: String = "Unnamed Layer"
@export var layer_visible: bool = true:
	set(value):
		layer_visible = value
		visible = value
		visibility_changed.emit(layer_name, value)

signal visibility_changed(name: String, is_visible: bool)


func place_at_coordinates(lat: float, lon: float, height: float) -> void:
	var twin_manager := _get_twin_manager()
	if twin_manager:
		position = twin_manager.geo_to_local(lat, lon, height)


func _get_twin_manager() -> Node:
	return get_tree().get_first_node_in_group("twin_manager") if get_tree() else null
