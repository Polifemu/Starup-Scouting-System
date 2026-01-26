# AI Scouting - Startup & Accelerator Discovery Tool

Prototipo automatizzato per lo scouting di acceleratori e startup europee con generazione AI di value propositions, sviluppato per il caso studio Paprika.

## 🎯 Funzionalità

- **Scouting Acceleratori**: Aggiunge automaticamente acceleratori europei al database
- **Aggiornamento Startups**: Scansiona i siti degli acceleratori per scoprire le loro startup
- **Generazione Value Propositions**: Utilizza OpenAI GPT per generare value propositions nel formato: *"Startup X helps Y do W so that Z"*
- **Deduplicazione Automatica**: Sistema idempotente che previene duplicati basandosi sugli URL
- **Logging Strutturato**: Traccia tutte le operazioni per debugging e auditing

## 📋 Prerequisiti

- Account Google (per Google Sheets e Apps Script)
- [OpenAI API Key](https://platform.openai.com/api-keys) (per la generazione delle value propositions)
- Node.js e npm (opzionale, per clasp)

## 🚀 Setup

### 1. Crea un Nuovo Google Sheet

1. Vai su [Google Sheets](https://sheets.google.com)
2. Crea un nuovo foglio di calcolo
3. Rinominalo (es. "AI Scouting Database")
4. Copia l'URL del foglio - lo useremo dopo

### 2. Configura Apps Script

#### Opzione A: Setup Manuale (più semplice)

1. Dal tuo Google Sheet, vai su **Estensioni → Apps Script**
2. Elimina il codice di default
3. Per ogni file nella cartella `src/`, crea un nuovo file in Apps Script:
   - Clicca su **+** accanto a "File"
   - Copia il nome del file (senza estensione `.gs`)
   - Incolla il contenuto del file

   File da creare:
   - `Config`
   - `Utils`
   - `Logger`
   - `SheetManager`
   - `AcceleratorScouting`
   - `StartupScraper`
   - `ValuePropGenerator`
   - `Code` (questo è il `Code.gs`, può sostituire il file Code.gs esistente)

4. Salva il progetto (⌘+S o Ctrl+S)
5. Torna al Google Sheet e ricarica la pagina
6. Vedrai apparire un nuovo menu "🚀 Startup Scouting AI"

#### Opzione B: Setup con clasp (per sviluppatori)

```bash
# Installa clasp globalmente
npm install -g @google/clasp

# Login a Google
clasp login

# Crea un nuovo progetto Apps Script
cd "prova per paprika"
clasp create --type sheets --title "AI Scouting" --rootDir ./src

# Push il codice
clasp push

# Apri il progetto nel browser
clasp open
```

Nota: Dovrai linkare il progetto Apps Script al tuo Google Sheet manualmente.

### 3. Configura l'API Key di OpenAI

1. Ottieni una API key da [OpenAI](https://platform.openai.com/api-keys)
2. Nel Google Sheet, apri il menu **🚀 Startup Scouting AI → ⚙️ Configure API Key**
3. Incolla la tua API key quando richiesto
4. La key verrà salvata in modo sicuro nelle Script Properties

> **💰 Nota sui Costi**: Il prototipo usa `gpt-4o-mini` che è molto economico (~$0.15 per 1M token di input). Per 100 value propositions, il costo stimato è < $0.50.

## 📖 Come Usare

### Inizializzazione

1. Apri il Google Sheet
2. Dal menu **🚀 Startup Scouting AI**, seleziona **📊 Initialize Sheets**
3. Verranno creati automaticamente i tre fogli: `accelerators`, `startups`, `logs`

### Workflow Completo

#### Step 1: Scout Accelerators

Menu: **🔍 Scout Accelerators**

- Aggiunge 10 acceleratori europei seed al database
- Idempotente: eseguirlo più volte non crea duplicati
- Acceleratori inclusi: Seedcamp, Techstars, Station F, etc.

#### Step 2: Update Startups

Menu: **🏢 Update Startups from Accelerators**

- Per ogni acceleratore nel database:
  - Cerca la pagina portfolio/alumni/companies
  - Estrae gli URL delle startup
  - Aggiunge le startup al database
- Può richiedere diversi minuti a seconda del numero di acceleratori
- Idempotente: startup già presenti vengono saltate

#### Step 3: Generate Value Propositions

Menu: **💡 Generate Value Propositions**

- Seleziona fino a 5 startup senza value proposition (configurabile in `Config.gs`)
- Per ogni startup:
  - Scarica il contenuto del sito web
  - Lo analizza con GPT-4o-mini
  - Genera una value proposition nel formato richiesto
  - Aggiorna il database
- ⚠️ **Questa operazione ha un costo** (vedi sezione costi)

### Funzioni Utility

- **📈 Show Statistics**: Mostra statistiche sul database (# acceleratori, startups, coverage)
- **🧹 Clear Logs**: Pulisce i log mantenendo solo gli ultimi 100
- **⚙️ Configure API Key**: Riconfigura l'OpenAI API key

## 📊 Struttura Dati

### Sheet: `accelerators`

| Column    | Type   | Description                          |
|-----------|--------|--------------------------------------|
| website   | String | URL dell'acceleratore (chiave unica) |
| name      | String | Nome dell'acceleratore               |
| country   | String | Paese di operazione                  |

### Sheet: `startups`

| Column           | Type   | Description                       |
|------------------|--------|-----------------------------------|
| website          | String | URL della startup (chiave unica)  |
| name             | String | Nome della startup                |
| country          | String | Paese                             |
| accelerator      | String | URL dell'acceleratore di origine  |
| value_proposition| String | Value proposition generata da AI  |

### Sheet: `logs`

| Column    | Type      | Description                    |
|-----------|-----------|--------------------------------|
| Timestamp | DateTime  | Data/ora del log               |
| Level     | String    | INFO / WARNING / ERROR         |
| Function  | String    | Modulo che ha generato il log  |
| Message   | String    | Messaggio leggibile            |
| Details   | JSON      | Dettagli aggiuntivi            |

## 🏗️ Architettura

```
src/
├── Code.gs                    # Entry point, menu UI
├── Config.gs                  # Configurazione e costanti
├── Utils.gs                   # Utility functions (URL, HTTP, parsing)
├── Logger.gs                  # Sistema di logging
├── SheetManager.gs            # Gestione Google Sheets (CRUD idempotente)
├── AcceleratorScouting.gs     # Scouting acceleratori
├── StartupScraper.gs          # Scraping startup da acceleratori
└── ValuePropGenerator.gs      # Generazione AI value propositions
```

### Principi di Design

- **Idempotenza**: Ogni operazione può essere eseguita multiple volte senza creare duplicati
- **Robustezza**: Gestione errori granulare - un errore non blocca l'intero processo
- **Logging**: Ogni operazione importante viene loggata per troubleshooting
- **Rate Limiting**: Delay automatici tra richieste per rispettare limiti API
- **Deduplicazione**: URL normalizzati e confrontati per prevenire duplicati

## ⚙️ Configurazione Avanzata

Modifica `src/Config.gs` per personalizzare:

```javascript
ACCELERATORS_BATCH_SIZE: 10,        // Numero acceleratori per batch
STARTUPS_PER_ACCELERATOR: 20,       // Max startup per acceleratore
VALUE_PROP_BATCH_SIZE: 5,           // Numero value props per esecuzione
LLM_MODEL: 'gpt-4o-mini',           // Modello OpenAI
API_DELAY_MS: 1000,                 // Delay tra chiamate API
```

## 🔍 Assunzioni e Limitazioni

### Assunzioni

1. **Acceleratori Seed**: Il prototipo parte da una lista curata di 10 acceleratori europei top
2. **Struttura Siti Web**: Si assume che gli acceleratori abbiano pagine pubbliche con portfolio/alumni
3. **Formato HTML**: Il parsing HTML è best-effort, funziona per siti strutturati standard
4. **OpenAI API**: Si assume disponibilità e accesso all'API OpenAI

### Limitazioni Tecniche

1. **Apps Script Timeout**: 6 minuti max per esecuzione
   - Per database molto grandi, potrebbe essere necessario eseguire le operazioni in più batch

2. **Web Scraping**:
   - Non supporta JavaScript rendering (SPA potrebbero non funzionare)
   - Siti con anti-scraping potrebbero bloccare le richieste
   - Strutture HTML non standard potrebbero non essere parsate correttamente

3. **Rate Limiting**:
   - Il sistema implementa delay base, ma API providers potrebbero comunque limitare
   - Per volumi molto grandi, potrebbe essere necessario aumentare i delay

4. **Qualità Dati**:
   - I nomi delle startup sono estratti dagli URL (euristico)
   - Le value propositions dipendono dalla qualità del contenuto web
   - Alcuni siti potrebbero non avere abbastanza informazioni

5. **Costi**:
   - Ogni value proposition richiede una chiamata OpenAI (~$0.002-0.005)
   - Per 1000 startups: ~$2-5

### Limitazioni di Business Logic

1. **Europa Focus**: Il seed data contiene solo acceleratori europei
2. **No Validation**: Non verifica se le startup sono realmente attive
3. **Static Seed**: Non scopre automaticamente nuovi acceleratori (solo seed list)
4. **Single Language**: Value propositions generate solo in inglese

## 🐛 Troubleshooting

### Il menu non appare

- Ricarica il Google Sheet
- Controlla che tutti i file siano stati caricati correttamente in Apps Script
- Verifica che la funzione `onOpen()` sia in `Code.gs`

### Errore "OPENAI_API_KEY not configured"

- Usa il menu **⚙️ Configure API Key** per impostare la chiave
- Verifica che la chiave sia valida su OpenAI

### Poche startup trovate

- Alcuni acceleratori potrebbero avere portfolio non pubblici o strutturati diversamente
- Controlla i log nel sheet `logs` per vedere i dettagli
- Puoi aggiungere startup manualmente al sheet

### Value propositions di bassa qualità

- Dipende dal contenuto del sito web della startup
- Siti con poco testo o JavaScript-heavy potrebbero dare risultati scarsi
- Puoi modificare il prompt in `ValuePropGenerator.gs` → `buildPrompt()`

## 🚧 Possibili Miglioramenti Futuri

1. **Auto-discovery Acceleratori**: Integrazione con Crunchbase/F6S API
2. **Multi-language Support**: Value props in più lingue
3. **Enrichment**: Aggiungere funding info, team size, etc.
4. **Validation**: Verificare che le startup siano attive (check domain age, social presence)
5. **Scheduling**: Trigger automatici per aggiornamenti periodici
6. **Export**: Funzionalità di export in CSV/JSON
7. **Filtering**: UI per filtrare per country, accelerator, etc.
8. **Better Scraping**: Integrazione con servizi come ScrapingBee per JavaScript rendering

## 📄 License

Questo progetto è stato sviluppato come caso studio per la candidatura AI Engineer presso Paprika.

## 👤 Autore

**Filippo Polidori**

- Email: [da inserire]
- Progetto sviluppato per: Paprika (<recruiting@paprika.social>)
- Data: Gennaio 2026

---

## 📧 Submission

Per condividere il progetto:

1. **Google Sheet**: Imposta il foglio come "Chiunque abbia il link può visualizzare"
2. **Repository**: Puoi condividere questo repository o creare un repo GitHub
3. **Email**: Invia a `recruiting@paprika.social` con oggetto "Candidatura AI Engineer"

**Include**:

- Link al Google Sheet con dati di esempio
- Link al repository Git
- Questo README

---

**Buon scouting! 🚀**
