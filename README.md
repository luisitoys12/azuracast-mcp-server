# azuracast-mcp-server

> MCP Server para [AzuraCast](https://www.azuracast.com/) — controla y monitorea tus estaciones de radio desde Claude, n8n, Cursor y cualquier cliente compatible con Model Context Protocol.

## Herramientas disponibles

| Tool | Descripción |
|------|-------------|
| `get_nowplaying` | Now playing actual (artista, título, portada, oyentes) |
| `get_song_history` | Historial reciente de canciones |
| `list_stations` | Lista todas las estaciones con ID y URL |
| `get_station` | Detalles completos de una estación |
| `list_media` | Lista archivos de media con metadata |
| `update_media_metadata` | Actualiza artista, título, álbum, género y año de un track |
| `restart_station` | Reinicia una estación |
| `skip_song` | Salta la canción actual (requiere AutoDJ activo) |

## Instalación

```bash
git clone https://github.com/luisitoys12/azuracast-mcp-server
cd azuracast-mcp-server
npm install
cp .env.example .env
# Edita .env con tu URL y API key
npm run build
```

## Variables de entorno

```env
AZURACASTURL=https://radio.kusmedios.lat
AZURACASTAPIKEY=TU_API_KEY_AQUI
```

> ⚠️ **Nunca subas tu `.env` a GitHub.** Ya está en `.gitignore`.

## Uso con Claude Desktop

Agrega en tu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "azuracast": {
      "command": "node",
      "args": ["/ruta/absoluta/azuracast-mcp-server/dist/index.js"],
      "env": {
        "AZURACAST_URL": "https://radio.kusmedios.lat",
        "AZURACAST_API_KEY": "TU_API_KEY_AQUI"
      }
    }
  }
}
```

## Uso con n8n

1. Agrega un nodo **MCP Client** en tu flujo.
2. Transporte: `stdio`.
3. Comando: `node /ruta/dist/index.js`
4. Variables de entorno: `AZURACAST_URL` y `AZURACAST_API_KEY`.

## Ejemplos de uso desde Claude

```
¿Qué está sonando ahora en la estación 4?
→ get_nowplaying({ station_id: 4 })

Muéstrame las últimas 20 canciones de kusmedios
→ get_song_history({ station_id: 4, rows: 20 })

Actualiza el artista del track 123 a "Adolescent's Orquesta"
→ update_media_metadata({ station_id: 4, media_id: 123, artist: "Adolescent's Orquesta" })
```

## Licencia

MIT — hecho con ❤️ para [EstacionKusmedios](https://estacionkusmedios.org)
