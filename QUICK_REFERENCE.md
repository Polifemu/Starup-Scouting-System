# Quick Reference - AI Scouting

## 📁 File Structure

```
src/
├── Code.gs                 (230 lines) - Entry point & UI
├── Config.gs              (103 lines) - Configuration
├── Utils.gs               (197 lines) - Utilities
├── Logger.gs               (90 lines) - Logging system
├── SheetManager.gs        (217 lines) - Sheet operations
├── AcceleratorScouting.gs  (89 lines) - Accelerator scouting
├── StartupScraper.gs      (185 lines) - Startup scraping
└── ValuePropGenerator.gs  (254 lines) - AI value props
```

**Total**: ~1,365 lines of code

## 🎯 Main Functions

### User Commands (via Menu)

- `onOpen()` - Creates menu
- `scoutAccelerators()` - Scout 10 accelerators
- `updateStartupsFromAccelerators()` - Scrape startups
- `generateValuePropositions()` - Generate value props with AI

### Core Operations

- `SheetManager.addAccelerator(data)` - Idempotent add
- `SheetManager.addStartup(data)` - Idempotent add
- `AcceleratorScouting.scoutAccelerators(batchSize)` - Main scouting
- `StartupScraper.scrapeStartupsFromAccelerator(accelerator)` - Scrape one
- `ValuePropGenerator.generateForStartup(startup)` - Generate one value prop

## ⚙️ Configuration (Config.gs)

```javascript
ACCELERATORS_BATCH_SIZE: 10      // Per batch
STARTUPS_PER_ACCELERATOR: 20     // Max per accelerator
VALUE_PROP_BATCH_SIZE: 5         // Per execution
LLM_MODEL: 'gpt-4o-mini'         // OpenAI model
API_DELAY_MS: 1000               // Between API calls
```

## 🔑 Key Features

1. **Idempotency**: URL-based deduplication
2. **Error Handling**: Graceful degradation, detailed logging
3. **Rate Limiting**: Automatic delays between requests
4. **Prompt Engineering**: Structured format validation
5. **Configuration**: Centralized, easily customizable

## 📊 Data Schema

### accelerators

- website (PK)
- name
- country

### startups

- website (PK)
- name
- country
- accelerator (FK)
- value_proposition

### logs

- Timestamp
- Level (INFO/WARNING/ERROR)
- Function
- Message
- Details (JSON)

## 💰 Costs

- Setup: Free
- Scout 10 accelerators: Free
- Update startups: Free
- Value props (5): ~$0.015-0.025
- **Total demo**: < $0.05

## 🚀 Quick Start

1. Create Google Sheet
2. Extensions → Apps Script
3. Copy all files from `src/`
4. Save & reload sheet
5. Configure API key
6. Run: Initialize → Scout → Update → Generate

## 📝 Testing Checklist

- [ ] Menu appears after reload
- [ ] Initialize creates 3 sheets
- [ ] Scout adds 10 accelerators
- [ ] Update finds startups
- [ ] Generate creates value props
- [ ] No duplicates on re-run
- [ ] Logs show operations
- [ ] Statistics show correct counts

## 🐛 Common Issues

**Menu not appearing**: Reload sheet
**API error**: Check API key configuration
**Few startups found**: Normal, depends on site structure
**Value prop format wrong**: Check logs for LLM responses

---

**Ready to deploy!** 🎉
