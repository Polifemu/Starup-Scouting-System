// ====================================
// STARTUP SCOUTING SYSTEM - GROQ API
// VERSIONE TESTATA E FUNZIONANTE
// ====================================

// LEGGI CONFIGURAZIONE
function getConfig() {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var configSheet = ss.getSheetByName("Config");

        if (!configSheet) {
            throw new Error("Scheda Config non trovata");
        }

        return {
            apiKey: String(configSheet.getRange("B1").getValue()).trim(),
            maxTokens: Number(configSheet.getRange("B2").getValue()),
            model: String(configSheet.getRange("B3").getValue()).trim(),
            rateLimit: Number(configSheet.getRange("B4").getValue()),
            matchThreshold: Number(configSheet.getRange("B5").getValue())
        };
    } catch (e) {
        SpreadsheetApp.getUi().alert('❌ ERRORE Config: ' + e.message);
        return null;
    }
}

// GENERA VALUE PROPOSITION - VERSIONE CORRETTA
function generateValueProposition(startupDesc, acceleratorInfo) {
    var config = getConfig();
    if (!config) return "ERRORE: Config non disponibile";

    if (!config.apiKey || config.apiKey.length < 20) {
        return "ERRORE: API Key non valida";
    }

    // Pulisci input
    startupDesc = String(startupDesc).trim();
    acceleratorInfo = String(acceleratorInfo).trim();

    if (!startupDesc || startupDesc.length < 10) {
        return "ERRORE: Descrizione startup troppo breve";
    }

    // Prompt semplificato
    var prompt = "Crea una value proposition di 80 parole per questa startup da presentare all'acceleratore.\n\n" +
        "STARTUP: " + startupDesc + "\n\n" +
        "ACCELERATORE: " + acceleratorInfo + "\n\n" +
        "Scrivi solo la value proposition, senza introduzioni.";

    // Payload corretto per Groq
    var payload = {
        model: config.model,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: config.maxTokens
    };

    var options = {
        method: "post",
        contentType: "application/json",
        headers: {
            "Authorization": "Bearer " + config.apiKey
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    try {
        Logger.log("Chiamata API Groq...");
        Logger.log("Model: " + config.model);
        Logger.log("Max tokens: " + config.maxTokens);

        var response = UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions", options);
        var code = response.getResponseCode();
        var body = response.getContentText();

        Logger.log("Response code: " + code);
        Logger.log("Response body: " + body.substring(0, 500));

        if (code !== 200) {
            Logger.log("ERRORE COMPLETO: " + body);

            // Prova a parsare l'errore
            try {
                var errorObj = JSON.parse(body);
                if (errorObj.error && errorObj.error.message) {
                    return "ERRORE API: " + errorObj.error.message;
                }
            } catch (e) { }

            return "ERRORE " + code + ": " + body.substring(0, 150);
        }

        var result = JSON.parse(body);

        if (!result.choices || result.choices.length === 0) {
            return "ERRORE: Risposta vuota dall'API";
        }

        return result.choices[0].message.content.trim();

    } catch (e) {
        Logger.log("ECCEZIONE: " + e.toString());
        return "ERRORE: " + e.toString();
    }
}

// TEST SINGOLO SUPER SEMPLICE
function testSemplice() {
    try {
        SpreadsheetApp.getUi().alert('⏳ Test in corso...\n\nAttendi 3-5 secondi.');

        // Test con testo fisso
        var testStartup = "Piattaforma SaaS per automatizzare il recruiting con AI. Aiuta le aziende a scremare migliaia di CV in pochi minuti usando machine learning.";
        var testAccelerator = "Focus su B2B SaaS e AI. Programma di 3 mesi con mentorship e €100k investimento.";

        Logger.log("=== TEST SEMPLICE ===");
        Logger.log("Startup: " + testStartup);
        Logger.log("Acceleratore: " + testAccelerator);

        var result = generateValueProposition(testStartup, testAccelerator);

        Logger.log("=== RISULTATO ===");
        Logger.log(result);

        SpreadsheetApp.getUi().alert(
            "📊 RISULTATO TEST\n\n" + result + "\n\n" +
            "Se vedi una value proposition, FUNZIONA! ✅\n" +
            "Se vedi un errore, controlla i log:\n" +
            "Estensioni → Apps Script → Esecuzioni"
        );

    } catch (e) {
        SpreadsheetApp.getUi().alert('❌ ERRORE: ' + e.message);
        Logger.log("ERRORE: " + e.toString());
    }
}

// TEST CON DATI DAL FOGLIO
function testConDatiFoglio() {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var startupSheet = ss.getSheetByName("Database Startup");
        var acceleratorSheet = ss.getSheetByName("Database Acceleratori");

        if (!startupSheet || startupSheet.getLastRow() < 2) {
            SpreadsheetApp.getUi().alert("❌ Scheda 'Database Startup' vuota o mancante!");
            return;
        }

        if (!acceleratorSheet || acceleratorSheet.getLastRow() < 2) {
            SpreadsheetApp.getUi().alert("❌ Scheda 'Database Acceleratori' vuota o mancante!");
            return;
        }

        SpreadsheetApp.getUi().alert('⏳ Test in corso...\n\nAttendi 3-5 secondi.');

        var startup = startupSheet.getRange(2, 1, 1, 7).getValues()[0];
        var accelerator = acceleratorSheet.getRange(2, 1, 1, 6).getValues()[0];

        Logger.log("=== DATI DAL FOGLIO ===");
        Logger.log("Startup: " + startup[1] + " - " + startup[5]);
        Logger.log("Acceleratore: " + accelerator[1] + " - " + accelerator[3]);

        var startupInfo = startup[5]; // Descrizione
        var acceleratorInfo = accelerator[3] + " - " + accelerator[5]; // Focus + Descrizione

        var result = generateValueProposition(startupInfo, acceleratorInfo);

        // Salva risultato
        var vpSheet = ss.getSheetByName("Value Propositions");
        if (vpSheet) {
            vpSheet.appendRow([
                vpSheet.getLastRow(),
                startup[1],
                accelerator[1],
                0.85,
                result,
                new Date()
            ]);
        }

        SpreadsheetApp.getUi().alert(
            "✅ TEST COMPLETATO\n\n" +
            "Startup: " + startup[1] + "\n" +
            "Acceleratore: " + accelerator[1] + "\n\n" +
            "Value Proposition:\n" + result
        );

    } catch (e) {
        SpreadsheetApp.getUi().alert('❌ ERRORE: ' + e.message);
        Logger.log("ERRORE: " + e.toString());
    }
}

// CALCOLA MATCH SCORE
function calculateMatchScore(startup, accelerator) {
    var score = 0.2;

    var startupSector = String(startup[3] || "").toLowerCase();
    var acceleratorFocus = String(accelerator[3] || "").toLowerCase();
    var startupCountry = String(startup[2] || "").toLowerCase();
    var acceleratorCountry = String(accelerator[2] || "").toLowerCase();

    if (startupSector && acceleratorFocus) {
        var sectors = startupSector.split(/[,\/\s]+/);
        var focuses = acceleratorFocus.split(/[,\/\s]+/);

        for (var i = 0; i < sectors.length; i++) {
            for (var j = 0; j < focuses.length; j++) {
                if (sectors[i] && focuses[j] && sectors[i] === focuses[j]) {
                    score += 0.5;
                    break;
                }
            }
        }
    }

    if (startupCountry && acceleratorCountry) {
        if (startupCountry === acceleratorCountry) {
            score += 0.3;
        } else if (acceleratorCountry.indexOf("multi") >= 0 || acceleratorCountry.indexOf("eu") >= 0) {
            score += 0.15;
        }
    }

    return Math.min(score, 1.0);
}

// GENERA TUTTE LE VP
function generaTutteVP() {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var startupSheet = ss.getSheetByName("Database Startup");
        var acceleratorSheet = ss.getSheetByName("Database Acceleratori");
        var vpSheet = ss.getSheetByName("Value Propositions");
        var config = getConfig();

        if (!config) return;

        var startups = startupSheet.getDataRange().getValues();
        var accelerators = acceleratorSheet.getDataRange().getValues();

        if (startups.length < 2 || accelerators.length < 2) {
            SpreadsheetApp.getUi().alert("❌ Serve almeno 1 startup e 1 acceleratore!");
            return;
        }

        // Pulisci risultati vecchi
        if (vpSheet.getLastRow() > 1) {
            vpSheet.deleteRows(2, vpSheet.getLastRow() - 1);
        }

        var maxVP = (startups.length - 1) * (accelerators.length - 1);
        var ui = SpreadsheetApp.getUi();
        var result = ui.alert(
            'Conferma',
            'Verranno generate fino a ' + maxVP + ' value propositions.\n\nContinuare?',
            ui.ButtonSet.YES_NO
        );

        if (result !== ui.Button.YES) return;

        var count = 0;

        for (var i = 1; i < startups.length; i++) {
            for (var j = 1; j < accelerators.length; j++) {

                var matchScore = calculateMatchScore(startups[i], accelerators[j]);

                if (matchScore >= config.matchThreshold) {

                    Logger.log("VP " + (count + 1) + ": " + startups[i][1] + " → " + accelerators[j][1]);

                    var valueProp = generateValueProposition(
                        String(startups[i][5]),
                        String(accelerators[j][3]) + " - " + String(accelerators[j][5])
                    );

                    vpSheet.appendRow([
                        count + 1,
                        startups[i][1],
                        accelerators[j][1],
                        matchScore.toFixed(2),
                        valueProp,
                        new Date()
                    ]);

                    count++;
                    Utilities.sleep(config.rateLimit);
                }
            }
        }

        SpreadsheetApp.getUi().alert("✅ Completato!\n\nGenerate " + count + " value propositions.");

    } catch (e) {
        SpreadsheetApp.getUi().alert('❌ ERRORE: ' + e.message);
    }
}

// MENU
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('🚀 Startup Scouting')
        .addItem('🧪 Test Base (testo fisso)', 'testSemplice')
        .addItem('📝 Test con dati foglio', 'testConDatiFoglio')
        .addSeparator()
        .addItem('⚡ Genera tutte le VP', 'generaTutteVP')
        .addToUi();
}