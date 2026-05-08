import { ChevronRight } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="section-container pb-10 md:pb-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="section-title">
          About <span className="italic">Ignite</span>{" "}
          <span className="text-accent">2.0</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-6 text-muted sm:text-base">
          Ignite is more than just a tournament. It is a celebration of
          sportsmanship, teamwork and passion.
        </p>
        <a className="primary-pill mt-6 inline-flex items-center gap-1" href="#leaderboard">
          Know More
          <ChevronRight aria-hidden="true" size={16} />
        </a>
      </div>
    </section>
  );
}
