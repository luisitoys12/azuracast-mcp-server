#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Config ───────────────────────────────────────────────────────────────────
const AZURA_URL = (process.env.AZURACAST_URL ?? "").replace(/\/$/, "");
const AZURA_KEY = process.env.AZURACAST_API_KEY ?? "";

if (!AZURA_URL || !AZURA_KEY) {
  console.error(
    "[azuracast-mcp] Faltan variables de entorno: AZURACAST_URL y AZURACAST_API_KEY"
  );
  process.exit(1);
}

// ─── Helper fetch ─────────────────────────────────────────────────────────────
async function azuraFetch(path: string, options: RequestInit = {}) {
  const url = `${AZURA_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "X-API-Key": AZURA_KEY,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AzuraCast API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Normalizar texto (capitalize words) ─────────────────────────────────────
function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ─── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "azuracast-mcp",
  version: "1.0.0",
});

// ── get_nowplaying ────────────────────────────────────────────────────────────
server.tool(
  "get_nowplaying",
  "Obtiene el now playing actual de una o todas las estaciones. Retorna artista, título, portada, duración y oyentes.",
  {
    station_id: z
      .union([z.string(), z.number()])
      .optional()
      .describe("ID o shortcode de la estación (opcional, sin valor = todas)"),
  },
  async ({ station_id }) => {
    const path = station_id ? `/api/nowplaying/${station_id}` : "/api/nowplaying";
    const data = await azuraFetch(path);

    const format = (entry: Record<string, unknown>) => {
      const np = (entry.now_playing ?? entry) as Record<string, unknown>;
      const song = (np.song ?? {}) as Record<string, string>;
      return {
        station: (entry.station as Record<string, string>)?.name ?? "Estación",
        artist: normalizeText(song.artist ?? ""),
        title: normalizeText(song.title ?? ""),
        display: `${normalizeText(song.artist ?? "")} - ${normalizeText(song.title ?? "")}`,
        art: song.art ?? "",
        elapsed: (np.elapsed as number) ?? 0,
        duration: (np.duration as number) ?? 0,
        listeners: (entry.listeners as Record<string, number>)?.current ?? 0,
      };
    };

    const result = Array.isArray(data) ? data.map(format) : [format(data)];
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ── get_song_history ──────────────────────────────────────────────────────────
server.tool(
  "get_song_history",
  "Obtiene el historial reciente de canciones de una estación.",
  {
    station_id: z.union([z.string(), z.number()]).describe("ID o shortcode de la estación"),
    rows: z.number().optional().default(10).describe("Cantidad de canciones (default 10)"),
  },
  async ({ station_id, rows }) => {
    const data = (await azuraFetch(
      `/api/station/${station_id}/history?rows=${rows}`
    )) as Array<Record<string, unknown>>;

    const result = data.map((entry) => {
      const song = (entry.song ?? {}) as Record<string, string>;
      return {
        artist: normalizeText(song.artist ?? ""),
        title: normalizeText(song.title ?? ""),
        display: `${normalizeText(song.artist ?? "")} - ${normalizeText(song.title ?? "")}`,
        played_at: entry.played_at,
      };
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ── list_stations ─────────────────────────────────────────────────────────────
server.tool(
  "list_stations",
  "Lista todas las estaciones configuradas en AzuraCast con su ID, nombre y estado.",
  {},
  async () => {
    const data = (await azuraFetch("/api/stations")) as Array<Record<string, unknown>>;
    const result = data.map((s) => ({
      id: s.id,
      shortcode: s.shortcode,
      name: s.name,
      description: s.description,
      is_public: s.is_public,
      listen_url: (s.listen_urls as Record<string, string>)?.http ?? "",
    }));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ── get_station ───────────────────────────────────────────────────────────────
server.tool(
  "get_station",
  "Obtiene detalles de una estación específica.",
  {
    station_id: z.union([z.string(), z.number()]).describe("ID o shortcode de la estación"),
  },
  async ({ station_id }) => {
    const data = await azuraFetch(`/api/station/${station_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── list_media ────────────────────────────────────────────────────────────────
server.tool(
  "list_media",
  "Lista los archivos de media de una estación. Útil para auditar metadata (artista, título, álbum).",
  {
    station_id: z.union([z.string(), z.number()]).describe("ID o shortcode de la estación"),
    page: z.number().optional().default(1).describe("Página (default 1)"),
    per_page: z.number().optional().default(25).describe("Resultados por página (default 25)"),
  },
  async ({ station_id, page, per_page }) => {
    const data = await azuraFetch(
      `/api/station/${station_id}/files?page=${page}&per_page=${per_page}`
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── update_media_metadata ─────────────────────────────────────────────────────
server.tool(
  "update_media_metadata",
  "Actualiza el metadata (artista, título, álbum, género, año) de un archivo de media en la estación.",
  {
    station_id: z.union([z.string(), z.number()]).describe("ID o shortcode de la estación"),
    media_id: z.union([z.string(), z.number()]).describe("ID del archivo de media"),
    artist: z.string().optional().describe("Nombre del artista"),
    title: z.string().optional().describe("Título de la canción"),
    album: z.string().optional().describe("Nombre del álbum"),
    genre: z.string().optional().describe("Género musical"),
    year: z.string().optional().describe("Año de lanzamiento"),
  },
  async ({ station_id, media_id, ...fields }) => {
    const body: Record<string, unknown> = {};
    if (fields.artist !== undefined) body["artist"] = normalizeText(fields.artist);
    if (fields.title !== undefined) body["title"] = normalizeText(fields.title);
    if (fields.album !== undefined) body["album"] = fields.album;
    if (fields.genre !== undefined) body["genre"] = fields.genre;
    if (fields.year !== undefined) body["year"] = fields.year;

    const data = await azuraFetch(`/api/station/${station_id}/file/${media_id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── restart_station ───────────────────────────────────────────────────────────
server.tool(
  "restart_station",
  "Reinicia una estación de AzuraCast. Útil tras cambios de configuración.",
  {
    station_id: z.union([z.string(), z.number()]).describe("ID o shortcode de la estación"),
  },
  async ({ station_id }) => {
    const data = await azuraFetch(`/api/station/${station_id}/restart`, { method: "POST" });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── skip_song ─────────────────────────────────────────────────────────────────
server.tool(
  "skip_song",
  "Salta la canción actual en una estación (requiere AutoDJ activo).",
  {
    station_id: z.union([z.string(), z.number()]).describe("ID o shortcode de la estación"),
  },
  async ({ station_id }) => {
    const data = await azuraFetch(`/api/station/${station_id}/backend/skip`, { method: "POST" });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ─── Start ────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[azuracast-mcp] Server iniciado y escuchando por stdio");
}

main().catch((err) => {
  console.error("[azuracast-mcp] Error fatal:", err);
  process.exit(1);
});
