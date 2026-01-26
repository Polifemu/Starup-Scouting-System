# Setup Instructions

## Quick Start Guide

### 1. Preparazione

1. Crea un nuovo Google Sheet
2. Salva l'URL del foglio
3. Ottieni una OpenAI API key da <https://platform.openai.com/api-keys>

### 2. Installazione Codice

#### Metodo Manuale (Consigliato per il prototipo)

1. Apri il Google Sheet
2. Vai su **Estensioni → Apps Script**
3. Elimina il codice di default `function myFunction() { ... }`
4. Per ogni file nella cartella `src/`:
   - Crea un nuovo file con lo stesso nome (es. `Config`, `Utils`, etc.)
   - Copia-incolla il contenuto
5. Salva (⌘+S)
6. Torna al Google Sheet e ricarica

#### Metodo clasp (Per sviluppatori)

```bash
# Installa clasp
npm install -g @google/clasp

# Login
clasp login

# Da questa directory
cd /Users/filippo/Desktop/prova\ per\ paprika

# Crea progetto
clasp create --type sheets --title "AI Scouting" --rootDir ./src

# Push codice
clasp push

# Apri nel browser
clasp open
```

Nota: Con clasp dovrai comunque linkare manualmente il progetto Apps Script al tuo Sheet.

### 3. Configurazione

1. Ricarica il Google Sheet
2. Vedrai il menu **🚀 Startup Scouting AI**
3. Clicca su **⚙️ Configure API Key**
4. Incolla la tua OpenAI API key

### 4. Inizializzazione

1. Clicca su **📊 Initialize Sheets**
2. Verranno creati i fogli: `accelerators`, `startups`, `logs`

### 5. Test

1. Clicca su **🔍 Scout Accelerators** → Dovrebbe aggiungere 10 acceleratori
2. Clicca su **🏢 Update Startups** → Dovrebbe trovare alcune startup
3. Clicca su **💡 Generate Value Propositions** → Genera le prime 5 value props

### 6. Verifica

Usa **📈 Show Statistics** per vedere i dati caricati.

## Troubleshooting

Se qualcosa non funziona:

1. Controlla i log nel foglio `logs`
2. Verifica che l'API key sia configurata
3. Assicurati che tutti i file siano stati caricati
4. Ricarica il Google Sheet

## Note

- Il prototipo usa `gpt-4o-mini` (economico)
- Costo stimato: ~$0.005 per value proposition
- Ogni operazione può richiedere diversi minuti
