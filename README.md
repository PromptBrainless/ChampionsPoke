# ChampionsPoke

Ein Projekt zur Integration von GitHub's AI-Modellen über Azure AI Inference.

## Features

- 🤖 Verwendung von GPT-4.1 über GitHub's AI-Endpoint
- 🔑 Authentifizierung mit GitHub Token
- 💬 Chat-basierte Kommunikation mit KI-Modellen

## Requirements

- Python 3.8+
- `GITHUB_TOKEN` Environment Variable gesetzt

## Installation

1. Clone das Repository:
```bash
git clone https://github.com/PromptBrainless/ChampionsPoke.git
cd ChampionsPoke
```

2. Installiere die Dependencies:
```bash
pip install -r requirements.txt
```

## Verwendung

1. Setze deinen GitHub Token als Environment Variable:
```bash
export GITHUB_TOKEN="your_github_token_here"
```

2. Führe das Skript aus:
```bash
python main.py
```

## Konfiguration

Die folgenden Parameter können in `main.py` angepasst werden:

- `endpoint`: GitHub AI Inference Endpoint
- `model`: GPT-4.1 Modell (kann geändert werden)
- `temperature`: Kreativität der Antworten (0.0 - 2.0)
- `top_p`: Diversität der Antworten (0.0 - 1.0)

## Lizenz

MIT
