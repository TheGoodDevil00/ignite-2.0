"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

// @ts-ignore
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

type TeamStats = {
  id: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
};

export function ExportPdfButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const supabase = createClient();

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name");
      if (teamsError) throw teamsError;

      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          id, home_team_id, away_team_id, round_id, status, estimated_start,
          match_scores(home_score, away_score),
          rounds(name)
        `)
        .order("estimated_start", { ascending: true });
      if (matchesError) throw matchesError;

      // 1. Calculate Leaderboard
      const teamStatsMap = new Map<number, TeamStats>();
      for (const t of teamsData || []) {
        teamStatsMap.set(t.id, {
          id: t.id,
          name: t.name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        });
      }

      for (const m of matchesData || []) {
        if (m.status !== "completed") continue;
        if (!m.match_scores) continue;
        const score = Array.isArray(m.match_scores)
          ? m.match_scores[0]
          : m.match_scores;
        if (!score) continue;

        const hId = m.home_team_id;
        const aId = m.away_team_id;

        if (hId && teamStatsMap.has(hId)) {
          const s = teamStatsMap.get(hId)!;
          s.played++;
          s.goalsFor += score.home_score;
          s.goalsAgainst += score.away_score;
          if (score.home_score > score.away_score) {
            s.won++;
            s.points += 3;
          } else if (score.home_score < score.away_score) {
            s.lost++;
          } else {
            s.drawn++;
            s.points += 1;
          }
        }

        if (aId && teamStatsMap.has(aId)) {
          const s = teamStatsMap.get(aId)!;
          s.played++;
          s.goalsFor += score.away_score;
          s.goalsAgainst += score.home_score;
          if (score.away_score > score.home_score) {
            s.won++;
            s.points += 3;
          } else if (score.away_score < score.home_score) {
            s.lost++;
          } else {
            s.drawn++;
            s.points += 1;
          }
        }
      }

      const sortedTeams = Array.from(teamStatsMap.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.name.localeCompare(b.name);
      });

      // 2. Group Fixtures by Round
      const matchesByRound: Record<string, typeof matchesData> = {};
      for (const m of matchesData || []) {
        // @ts-ignore
        const roundName = m.rounds?.name || `Round ${m.round_id}`;
        if (!matchesByRound[roundName]) {
          matchesByRound[roundName] = [];
        }
        matchesByRound[roundName].push(m);
      }

      const getTeamName = (id: number | null) => {
        if (!id) return "TBD";
        const t = teamsData?.find((t) => t.id === id);
        return t ? t.name : "TBD";
      };

      // 3. Build Document Definition
      const docDefinition: TDocumentDefinitions = {
        pageSize: "A4",
        pageMargins: [40, 60, 40, 60],
        header: {
          text: "Ignite 2.0 Official Report",
          alignment: "right",
          margin: [0, 20, 40, 0],
          fontSize: 10,
          color: "gray",
        },
        footer: (currentPage, pageCount) => {
          return {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: "center",
            fontSize: 10,
            color: "gray",
            margin: [0, 20, 0, 0],
          };
        },
        content: [
          { text: "Tournament Report", style: "header" },
          { text: "Leaderboard", style: "subheader" },
          {
            table: {
              headerRows: 1,
              widths: ["auto", "*", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
              body: [
                [
                  { text: "Rank", style: "tableHeader", alignment: "center" as const },
                  { text: "Team", style: "tableHeader" },
                  { text: "Pts", style: "tableHeader", alignment: "center" as const },
                  { text: "Pld", style: "tableHeader", alignment: "center" as const },
                  { text: "W", style: "tableHeader", alignment: "center" as const },
                  { text: "D", style: "tableHeader", alignment: "center" as const },
                  { text: "L", style: "tableHeader", alignment: "center" as const },
                  { text: "GF", style: "tableHeader", alignment: "center" as const },
                  { text: "GA", style: "tableHeader", alignment: "center" as const },
                ],
                ...sortedTeams.map((team, index) => [
                  { text: String(index + 1), alignment: "center" as const },
                  { text: team.name },
                  { text: String(team.points), alignment: "center" as const, bold: true },
                  { text: String(team.played), alignment: "center" as const },
                  { text: String(team.won), alignment: "center" as const },
                  { text: String(team.drawn), alignment: "center" as const },
                  { text: String(team.lost), alignment: "center" as const },
                  { text: String(team.goalsFor), alignment: "center" as const },
                  { text: String(team.goalsAgainst), alignment: "center" as const },
                ]),
              ],
            },
          },
          { text: "Fixtures & Results", style: "subheader", margin: [0, 30, 0, 10] },
          ...Object.entries(matchesByRound).flatMap(([roundName, matches]) => [
            { text: roundName, style: "roundHeader" } as any,
            {
              table: {
                headerRows: 1,
                widths: ["*", "auto", "auto", "auto", "*", "auto"],
                body: [
                  [
                    { text: "Home Team", style: "tableHeader", alignment: "right" as const },
                    { text: "Score", style: "tableHeader", alignment: "center" as const },
                    { text: "vs", style: "tableHeader", alignment: "center" as const },
                    { text: "Score", style: "tableHeader", alignment: "center" as const },
                    { text: "Away Team", style: "tableHeader" },
                    { text: "Status", style: "tableHeader", alignment: "center" as const },
                  ],
                  ...matches.map((m) => {
                    const homeTeam = getTeamName(m.home_team_id);
                    const awayTeam = getTeamName(m.away_team_id);
                    const scores = Array.isArray(m.match_scores)
                      ? m.match_scores[0]
                      : m.match_scores;
                    const homeScore = scores ? scores.home_score : "-";
                    const awayScore = scores ? scores.away_score : "-";
                    return [
                      { text: homeTeam, alignment: "right" as const },
                      { text: String(homeScore), alignment: "center" as const, bold: true },
                      { text: "-", alignment: "center" as const },
                      { text: String(awayScore), alignment: "center" as const, bold: true },
                      { text: awayTeam },
                      { text: m.status, alignment: "center" as const, fontSize: 9 },
                    ];
                  }),
                ],
              },
              margin: [0, 0, 0, 15] as [number, number, number, number],
            } as any,
          ]),
        ],
        styles: {
          header: {
            fontSize: 24,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 20],
          },
          subheader: {
            fontSize: 18,
            bold: true,
            margin: [0, 10, 0, 10],
          },
          roundHeader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 5],
          },
          tableHeader: {
            bold: true,
            fillColor: "#eeeeee",
          },
        },
        defaultStyle: {
          fontSize: 11,
        },
      };

      pdfMake.createPdf(docDefinition).download("Ignite2.0_Tournament_Report.pdf");
    } catch (error) {
      console.error("Export PDF error:", error);
      alert("An error occurred while generating the PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-bold text-white transition hover:bg-accent/90 disabled:opacity-50"
    >
      {isExporting ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Download className="h-5 w-5" />
      )}
      {isExporting ? "Generating PDF..." : "Export as PDF"}
    </button>
  );
}
