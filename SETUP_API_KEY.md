# Setup API Key (Environment Variables)

Per sicurezza, **non scrivere la API Key nel codice**.
Usa invece i **Script Properties** di Google Apps Script, che funzionano come un file `.env`.

## Procedura

1. Apri l'editor di script (Estensioni > Apps Script).
2. Vai su **Impostazioni del progetto** (icona ingranaggio a sinistra).
3. Scorri fino a **Proprietà script**.
4. Clicca su **Aggiungi proprietà script**.
5. Inserisci:
    * **Proprietà:** `GROQ_API_KEY`
    * **Valore:** `gsk_...` (la tua chiave Groq)
6. Clicca su **Salva proprietà script**.

Il codice ora leggerà automaticamente questa chiave.
In alternativa, puoi ancora usare la cella **B1** del foglio `Config` come fallback.
