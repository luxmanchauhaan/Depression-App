# Depression app — backend skeleton (step 1 & 2)

This covers the database schema and the Node/Express backend skeleton with
auth + doctor-patient linking, following the build order we agreed on.

## What's included

- `database/schema.sql` — full MySQL schema (users, doctors, patients,
  bdi_responses, mood_logs, emotion_captures, activities,
  diet_recommendations, recommendation_log)
- `backend/` — Express API with:
  - `POST /api/auth/signup/doctor` — doctor signup, generates a `doctor_code`
  - `POST /api/auth/signup/patient` — patient signup, requires the doctor's
    `doctor_code` to link them
  - `POST /api/auth/login` — returns a JWT for either role
  - `GET /health` — sanity check route
  - JWT middleware (`requireAuth`, `requireRole`) ready for the next set of
    protected routes (BDI-II submission, dashboards, etc.)

## Setup

1. **Create the database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

2. **Configure the backend**
   ```bash
   cd backend
   cp .env.example .env
   # edit .env with your real DB_USER / DB_PASSWORD / JWT_SECRET
   npm install
   ```

3. **Run it**
   ```bash
   npm run dev   # or: npm start
   ```
   You should see `Database connection established.` and
   `Server running on http://localhost:4000`.

4. **Test it** (with curl or Postman)
   ```bash
   curl -X POST http://localhost:4000/api/auth/signup/doctor \
     -H "Content-Type: application/json" \
     -d '{"email":"doc@example.com","password":"pass1234","full_name":"Dr Rao","doctor_code":"DR001"}'

   curl -X POST http://localhost:4000/api/auth/signup/patient \
     -H "Content-Type: application/json" \
     -d '{"email":"pat@example.com","password":"pass1234","full_name":"Asha","doctor_code":"DR001"}'

   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"pat@example.com","password":"pass1234"}'
   ```

## Next up (step 3)

BDI-II questionnaire submission + server-side scoring
(`POST /api/patients/:id/bdi`), using the `scoreBDI()` logic we discussed —
plain arithmetic, no AI, writes into `bdi_responses`.
