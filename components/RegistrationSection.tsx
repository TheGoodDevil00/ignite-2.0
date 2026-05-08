"use client";

import { useState } from "react";
import Image from "next/image";
import { registrationFields } from "@/lib/mockData";

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

          <div className="relative mx-auto h-[270px] w-[150px] md:h-[338px] md:w-[190px]">
            <Image
              src="/images/teams.png"
              alt=""
              fill
              sizes="190px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
