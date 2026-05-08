"use client";

import { useState } from "react";
import { leaderboard, registrationFields } from "@/lib/mockData";
import { Shield } from "lucide-react";

export function RegistrationSection() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="register" className="section-band bg-section">
      <div className="section-container">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h2 className="content-heading">Register Your Team</h2>
            <p className="mt-2 text-xs font-semibold uppercase text-muted">
              Fill in the details of your team
            </p>

            <form
              className="mt-5 grid max-w-xl gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              {registrationFields.map((field) => (
                <label className="block" htmlFor={field} key={field}>
                  <span className="sr-only">{field}</span>
                  <input
                    className="form-input"
                    id={field}
                    name={field}
                    placeholder={field}
                    type={field.includes("Email") ? "email" : "text"}
                  />
                </label>
              ))}
              <button className="primary-pill mt-1 w-fit px-8" type="submit">
                Register
              </button>
              {submitted ? (
                <p className="text-sm font-semibold text-muted" role="status">
                  Team details saved locally for the frontend demo.
                </p>
              ) : null}
            </form>
          </div>

          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-subtle bg-card shadow-glass backdrop-blur">
            <div className="border-b border-subtle p-3 text-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Registered Teams</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {leaderboard.map((row) => (
                <div key={row.rank} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-field/50 border border-subtle/50 text-muted">
                    <Shield size={16} />
                  </div>
                  <span className="text-sm font-semibold text-white">{row.team}</span>
                </div>
              ))}
            </div>
            <div className="p-3">
              <button type="button" className="w-full rounded bg-field/50 py-2 text-xs font-semibold uppercase text-muted hover:bg-field transition-colors border border-subtle/30">
                View All Teams
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
