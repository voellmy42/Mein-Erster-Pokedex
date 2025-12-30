<div align="center">
<img width="200" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" alt="Pikachu" />

# Mein Erster Pokedex
### Ein KI-gestützter Begleiter für junge Trainer
</div>

---

Willkommen bei **Mein Erster Pokedex**! Eine moderne, kindgerechte Web-App, die die Welt der Pokemon mit der Macht künstlicher Intelligenz verbindet. 

Dieses Projekt wurde entwickelt, um nicht nur als Nachschlagewerk zu dienen, sondern auch interaktiv beim Lernen und Strategie-Planen zu helfen – alles verpackt in einem wunderschönen, animierten Design.

## ✨ Features

### 🔍 KI-Bilderkennung
Lade ein Foto oder Screenshot hoch, und unsere KI identifiziert das Pokemon sofort! Egal ob Karte, Plüschtier oder Zeichnung.

### 📖 Interaktiver Pokedex
Detaillierte Informationen zu jedem Pokemon, inklusive:
- Typen (mit Stärken & Schwächen)
- Basiswerte (Stats) und Entwicklungen
- Shiny-Vorschau

### 🗣️ Vorlesen ("Read Aloud")
Perfekt für Leseanfänger: Ein Klick genügt, und der Pokedex liest dir die Beschreibung und Fakten zum Pokemon vor – mit angenehmer, natürlicher Stimme.
*Neu: Mit visuellem Ladebalken für sofortiges Feedback!*

### 🧠 Intelligente Team-Analyse
Baue dein Traum-Team im **Team Planer** und lass es von der KI bewerten!
- **Strategische Bewertung**: Bekomme einen Score (1-10).
- **Stärken & Schwächen**: Verstehe, wo dein Team glänzt und wo es angreifbar ist.
- **Verbesserungsvorschläge**: Die KI schlägt konkrete Tausch-Optionen vor, um dein Team unschlagbar zu machen.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/) (Vision & Text-to-Speech)
- **Data**: [PokeAPI](https://pokeapi.co/)

## 🚀 Installation & Start

1. **Repository klonen**
   ```bash
   git clone https://github.com/yourusername/mein-erster-pokedex.git
   cd mein-erster-pokedex
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen setzen**
   Erstelle eine `.env.local` Datei im Hauptverzeichnis und füge deinen Gemini API Key hinzu:
   ```env
   VITE_GEMINI_API_KEY=dein_api_key_hier
   ```

4. **App starten**
   ```bash
   npm run dev
   ```
   Öffne `http://localhost:5173` in deinem Browser.

---

<div align="center">
Gotta Catch 'Em All! 🔴⚪
</div>
