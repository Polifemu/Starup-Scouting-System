# Startup Scouting System

Sistema automatizzato per lo scouting di startup e acceleratori europei basato su Google Apps Script e AI (Groq/Llama 3).

## 🚀 Funzionalità

- **Scouting Acceleratori**: Ricerca automatica di acceleratori tramite AI (o seed list).
- **Scouting Startup**: Visita i siti web degli acceleratori e identifica le startup del portfolio.
- **Value Propositions**: Visita i siti web delle startup e genera una Value Proposition su misura.
- **Deduplicazione**: Sistema robusto che evita duplicati basandosi sugli URL normalizzati.

## 📋 Prerequisiti

1. **Google Sheet**: Un foglio di calcolo Google vuoto.
2. **Groq API Key**: Ottenibile su [console.groq.com](https://console.groq.com).

## 🛠 Installazione

### Metodo 1: Git + Clasp (Consigliato)

1. Clona il repository:

    ```bash
    git clone https://github.com/Polifemu/Starup-Scouting-System.git
    cd Starup-Scouting-System
    ```

2. Installa le dipendenze:

    ```bash
    npm install -g @google/clasp
    clasp login
    ```

3. Crea un nuovo progetto Apps Script:

    ```bash
    clasp create --type sheets --title "Startup Scouting AI" --rootDir ./src
    ```

4. Pusha il codice:

    ```bash
    clasp push
    ```

### Metodo 2: Manuale

1. Crea un nuovo Google Sheet.
2. Vai su **Estensioni > Apps Script**.
3. Copia il contenuto dei file nella cartella `src/` creando i corrispondenti file `.gs` nell'editor online.

## 🔑 Configurazione API Key

Per sicurezza, questo progetto usa le **Script Properties** come variabili d'ambiente.

1. In Apps Script, vai su **Impostazioni del progetto** (icona ingranaggio a sinistra).
2. Scorri fino a **Proprietà script**.
3. Aggiungi una nuova proprietà:
    - **Proprietà:** `GROQ_API_KEY`
    - **Valore:** La tua chiave Groq (es. `gsk_...`)
4. Salva.

> 📄 Vedi [SETUP_API_KEY.md](./SETUP_API_KEY.md) per istruzioni dettagliate.

## 📖 Utilizzo

1. Ricarica il Google Sheet.
2. Apparirà il menu **🚀 Scouting AI**.
3. **Inizializza Fogli**: Prepara le colonne e i fogli necessari.
4. **Scopri Acceleratori**: Popola la lista iniziale.
5. **Scopri Startup**: Avvia lo scraping dei siti degli acceleratori per trovare startup.
6. **Matching e Value Prop**: Genera le descrizioni visitando i siti delle startup trovate.

## 📊 Struttura Dati

Il sistema crea due fogli principali:
- **Database Acceleratori**: Lista degli acceleratori monitorati.
- **Database Startup**: Lista delle startup trovate, con colonna dedicata per la **Value Proposition**.

## 🛡 Sicurezza e Privacy

- Le API Key non sono mai salvate nel codice sorgente.
- Il codice gira interamente nel tuo account Google.

---
Sviluppato come caso studio per l'integrazione di agenti AI in flussi di lavoro aziendali.
