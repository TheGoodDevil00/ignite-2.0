import { leaderboard } from "@/lib/mockData";

export function LeaderboardSection() {
  return (
    <section id="leaderboard" className="section-band bg-primary">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="content-heading">Leaderboard</h2>
          <p className="mt-2 text-sm text-muted">Team standings</p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-subtle bg-card shadow-glass backdrop-blur">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead className="bg-field text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3 text-center">P</th>
                <th className="px-4 py-3 text-center">W</th>
                <th className="px-4 py-3 text-center">D</th>
                <th className="px-4 py-3 text-center">L</th>
                <th className="px-4 py-3 text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr className="border-t border-subtle" key={row.rank}>
                  <td className="px-4 py-3 font-bold text-accent">{row.rank}</td>
                  <td className="px-4 py-3 font-semibold text-text">{row.team}</td>
                  <td className="px-4 py-3 text-center text-muted">{row.played}</td>
                  <td className="px-4 py-3 text-center text-muted">{row.won}</td>
                  <td className="px-4 py-3 text-center text-muted">{row.drawn}</td>
                  <td className="px-4 py-3 text-center text-muted">{row.lost}</td>
                  <td className="px-4 py-3 text-center font-bold text-text">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
