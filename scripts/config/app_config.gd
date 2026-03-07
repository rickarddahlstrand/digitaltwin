extends Node
## Autoload singleton for API key management.
## Loads Google Maps API key from environment variable or user config file.

const GOOGLE_TILES_URL := "https://tile.googleapis.com/v1/3dtiles/root.json?key=%s"
const CONFIG_PATH := "user://api_keys.cfg"

var _api_key: String = ""


func _ready() -> void:
	_api_key = _load_api_key()
	if _api_key.is_empty():
		push_warning("Google Maps API key not found. Set GOOGLE_MAPS_API_KEY env var or add key to %s" % CONFIG_PATH)


func get_api_key() -> String:
	return _api_key


func get_tileset_url() -> String:
	if _api_key.is_empty():
		return ""
	return GOOGLE_TILES_URL % _api_key


func _load_api_key() -> String:
	# Try environment variable first
	var env_key := OS.get_environment("GOOGLE_MAPS_API_KEY")
	if not env_key.is_empty():
		return env_key

	# Fall back to config file
	var config := ConfigFile.new()
	if config.load(CONFIG_PATH) == OK:
		return config.get_value("api_keys", "google_maps", "")

	return ""


func save_api_key(key: String) -> void:
	_api_key = key
	var config := ConfigFile.new()
	config.load(CONFIG_PATH)
	config.set_value("api_keys", "google_maps", key)
	config.save(CONFIG_PATH)
