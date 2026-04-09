# Plan dropdowns: year (age) — the problem

## The problem (straight answer)

Screens show lines like **`2026 (35)`** and **`2080 (??)`**.

You want:

1. **Start:** real age on the plan start date → e.g. **35**, not **36**.
2. **End:** last row is the **plan end year** (e.g. **2080** when the user chose “live to **90**” and birth year is 1990).
3. **Every step:** ages should go **… 88, 89, 90** with **no gap** (not **88** then **90**).
4. **Sometimes also:** the last bracket should read **90**, not **89**.

**You cannot get all four at once** with one simple rule. Something has to give (explained below).

---

## Example (use these numbers)

| | Client |
|---|--------|
| Born | **1 October 1990** |
| Plan starts (forecast) | **1 April 2026** |
| Age **on that start date** | **35** (birthday is later in 2026 → still 35) |
| User chose plan duration | **90** → last calendar year **1990 + 90 = 2080** |

Dropdown columns: **2026, 2027, …, 2079, 2080**.

---

## What went wrong before

**Bug A — Wrong start**

- If we use “age on **31 December**” of 2026 for the first row, the client is already **36** (October birthday passed).  
- User expects **`2026 (35)`** because the plan **started** in April at age **35**.

**Bug B — Skipped age at the end**

- Rows use “add 1 year of age per calendar year” from April 2026 → **2079** shows **88**.
- Only the **last** row uses “age at **end** of 2080” → **90**.
- User sees **`2079 (88)`** and **`2080 (90)`** — **89** never appears.

Both bugs come from **changing the rule** in the middle of the list.

---

## The unavoidable trade-off (same example)

Forecast year **2026** → last year **2080**: difference **2080 − 2026 = 54**.  
If the bracket age goes up by **1** for each calendar year:

- **2026:** 35  
- **2027:** 36  
- …  
- **2080:** **35 + 54 = 89**

So with a **fixed** last year **2080** and **+1 per row**, the last age is **89**, not **90**.

**90** on the last row is a **different** definition (e.g. “age by end of 2080 / after birthday in 2080”). That is **one more** than the simple ladder above. Using **90** only on the last row brings back **Bug B** unless you change the calendar range or accept a double jump somewhere.

**Summary:** Pick any three of these; the fourth often breaks:

| Want | Forces |
|------|--------|
| Start **35** | Age on **forecast date**, not 31 Dec of first year |
| Last **year** **2080** | From birth **1990** + duration **90** |
| **+1** every row, no skip | **2080** shows **89**, not **90** |
| Last bracket **90** | Either last year or step pattern must change, or you skip an age |

---

## What we do today (frontend)

**One rule for all years from the forecast year onward:**

`age(year) = age on forecast date + (year − forecast year)`

- **Start:** **35** in **2026** ✓  
- **No skipped ages** ✓  
- **Last year** is still **2080** ✓  
- **Last bracket** is **89** in this example (not **90**) — that is the trade-off.

Code: `frontend/src/app/shared/utils/client-age-at-reference.ts` → `getProjectionColumnAgeLabel`.

---

## Other fixes (if product insists on “90” on the last line)

| Approach | Idea | Catch |
|----------|------|--------|
| **Longer calendar** | Last year **2081** so `35 + 55 = 90` | **2081** may not match “1990 + 90” unless the whole product uses one definition of “end year”. |
| **Tooltip / second label** | Keep **2080 (89)** and show “target age **90**” elsewhere | Extra UI copy. |
| **Last row only = 90** | Linear everywhere, EOY on last row | Usually **88 → 90**, skip **89**. |

---

## Backend note

Default cashflows (state pension, living costs, etc.) should end in the **same calendar year as the plan timeline**, not a different formula. See `CashflowService` / timeline `ForecastEndDate`.

---

## If users report…

| They say | Usually means |
|----------|----------------|
| “Start should be **35**, shows **36**” | First row used **31 December** age — use age **on forecast date** for the first year. |
| “**88** then **90**” | Mixed linear + end-of-year on last row only — use **one** rule for all rows. |
| “Last should say **90**” | With **2080** and **+1** rows, math gives **89** — see trade-off table; need product choice. |

Keep this doc in sync when you change `getProjectionColumnAgeLabel`.
