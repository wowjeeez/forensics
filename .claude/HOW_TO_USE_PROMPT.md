# How to Use the Claude Code Prompt

## Location
The full prompt is saved at:
```
/Users/levander/coding/detective/.claude/CLAUDE_CODE_PROMPT.md
```

## Quick Start

### Option 1: Full Project Context
Copy the entire content of `CLAUDE_CODE_PROMPT.md` and paste it into Claude Code.

### Option 2: Reference Approach
In Claude Code, say:
```
Read and follow the instructions in /Users/levander/coding/detective/.claude/CLAUDE_CODE_PROMPT.md
```

## What the Prompt Covers

### 4 Main Tasks (in recommended order)

1. **Index Indicator** (Simplest first)
   - Visual status icons in file tree
   - Status bar integration
   - Indexing progress panel
   - Context menu actions

2. **Tags System** (Standalone)
   - Tag any file with unlimited tags
   - Context menu integration
   - Tag manager UI
   - Tag-based filtering and search
   - SQLite storage backend

3. **Groups Functionality** (Fix existing)
   - Debug and fix current GroupManager bugs
   - Add context menu "Add to Group"
   - Store text content + path + metadata
   - Group operations (combine, isolate, intersect, export)
   - Persistence layer

4. **Cross-File Structured Search** (Most complex)
   - Connect UI to Tantivy backend
   - Implement/verify Rust indexing code
   - Type-specific extractors (SQLite, JSON, CSV, Excel, XML)
   - Query builder UI
   - Search result display

## Key Instructions in the Prompt

1. **Read Documentation First**
   - ARCHITECTURE.md
   - INDEX_ARCHITECTURE.md
   - FRONTEND_FEATURES.md
   - CONTEXT_EXPLORATION.md

2. **Explore Before Implementing**
   - Audit existing code
   - Document current state
   - Identify what's missing

3. **Document Everything**
   - Create IMPLEMENTATION_NOTES.md
   - Track issues in ISSUES_AND_SOLUTIONS.md
   - Update context files as you go

4. **Test Incrementally**
   - Don't build everything at once
   - Test each feature thoroughly
   - Verify performance with large datasets

## Success Metrics

Each task has specific success criteria defined. Claude Code should verify:
- ✅ All features work as specified
- ✅ No regressions in existing functionality
- ✅ Performance is acceptable
- ✅ Code follows project patterns
- ✅ Documentation is updated

## Important Notes

- The prompt is comprehensive and expert-level
- It includes detailed implementation steps
- It provides data structures and code examples
- It emphasizes reading existing code first
- It prioritizes performance and UX

## If You Need to Modify

The prompt is in markdown, so you can:
1. Edit specific sections
2. Add clarifications
3. Adjust priorities
4. Add constraints

Just update the file and re-reference it in Claude Code.

## Estimated Effort

- Index Indicator: ~2-4 hours
- Tags System: ~4-6 hours
- Groups (Fix & Enhance): ~4-8 hours
- Cross-File Search: ~8-16 hours

Total: ~18-34 hours depending on existing code state

## Next Steps

1. Copy the prompt from CLAUDE_CODE_PROMPT.md
2. Start Claude Code in your terminal
3. Paste the prompt
4. Let Claude Code explore and implement
5. Review the documentation it creates in .claude/
6. Test each feature as it's completed
