# azuracast-mcp-server

> MCP Server para [AzuraCast](https://www.azuracast.com/) — controla y monitorea tus estaciones de radio desde Claude, n8n, Cursor y cualquier cliente MCP.

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

---

## 🚀 Deploy en Render (recomendado)

El repo incluye un `render.yaml` listo. Sólo necesitas:

1. Ve a [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
2. Conecta este repositorio: `luisitoys12/azuracast-mcp-server`.
3. Render detecta el `render.yaml` automáticamente.
4. En la pestaña **Environment**, agrega:
   - `AZURACAST_URL` → `https://radio.kusmedios.lat`
   - `AZURACAST_API_KEY` → tu API key
   - `MCP_API_TOKEN` → se genera automáticamente (cópialo para tu cliente MCP)
5. Da clic en **Apply** y espera el deploy.

Tu endpoint queda en:
```
https://azuracast-mcp-server.onrender.com/mcp
```

### Configurar en Claude Desktop (modo remoto)

```json
{
  "mcpServers": {
    "azuracast": {
      "url": "https://azuracast-mcp-server.onrender.com/mcp",
      "headers": {
        "Authorization": "Bearer TU_MCP_API_TOKEN"
      }
    }
  }
}
```

---

## 💻 Instalación local (modo stdio)

```bash
git clone https://github.com/luisitoys12/azuracast-mcp-server
cd azuracast-mcp-server
npm install
cp .env.example .env
# Edita .env con tu URL y API key
npm run build
```

### Config Claude Desktop (modo local/stdio)

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

---

## 🧩 Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `AZURACAST_URL` | Sí | URL base de tu AzuraCast (sin trailing slash) |
| `AZURACAST_API_KEY` | Sí | API Key de AzuraCast |
| `MCP_API_TOKEN` | No | Token Bearer para proteger el endpoint HTTP |
| `PORT` | No | Puerto HTTP (Render lo inyecta automáticamente) |

> ⚠️ **Nunca subas tu `.env` a GitHub.** Ya está en `.gitignore`.

---

## Uso con n8n

1. Agrega un nodo **MCP Client**.
2. Tipo de conexión: `Streamable HTTP`.
3. URL: `https://azuracast-mcp-server.onrender.com/mcp`
4. Header: `Authorization: Bearer TU_MCP_API_TOKEN`

---

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
