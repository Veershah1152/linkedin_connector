"use client";
import { useState, useEffect } from "react";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    avgEngagementRate: "0.0",
  });
  const [topPosts, setTopPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch dashboard stats
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/analytics/dashboard`, {
          credentials: "include",
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats({
            totalViews: statsData.data.totalViews || 0,
            totalLikes: statsData.data.totalLikes || 0,
            totalComments: statsData.data.totalComments || 0,
            avgEngagementRate: statsData.data.avgEngagementRate || "0.0",
          });
        }

        // Fetch top posts (using published posts for now)
        const postsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts?status=published`, {
          credentials: "include",
        });
        const postsData = await postsRes.json();
        if (postsData.success && postsData.posts) {
          // Sort by likes for a simple "top posts" logic, since we don't have full analytics yet
          const sorted = [...postsData.posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);
          setTopPosts(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const STATS_CARDS = [
    { label: "Total Views", value: stats.totalViews.toLocaleString(), change: "All time", icon: "👁️", color: "#3B82F6" },
    { label: "Total Likes", value: stats.totalLikes.toLocaleString(), change: "All time", icon: "❤️", color: "#EF4444" },
    { label: "Comments", value: stats.totalComments.toLocaleString(), change: "All time", icon: "💬", color: "#22C55E" },
    { label: "Engagement Rate", value: `${stats.avgEngagementRate}%`, change: "Average", icon: "📈", color: "#A78BFA" },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Analytics</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>Track your LinkedIn performance and growth.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading analytics...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 40 }}>
            {STATS_CARDS.map((s) => (
              <div key={s.label} className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.label}</span>
                  <span style={{ fontSize: 20, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-md)", background: `${s.color}15` }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--status-success)", marginTop: 4 }}>{s.change}</div>
              </div>
            ))}
          </div>

          {/* Top Posts */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Top Performing Posts</h2>
            {topPosts.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                No published posts to analyze yet.
              </div>
            ) : (
              <div className="card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--bg-tertiary)" }}>
                      {["Post", "Date", "Status"].map((h) => (
                        <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts.map((p, i) => (
                      <tr key={i} style={{ borderBottom: i < topPosts.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                        <td style={{ padding: "16px 20px", fontWeight: 600, fontSize: 14, maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.content}</td>
                        <td style={{ padding: "16px 20px", fontSize: 14, color: "var(--text-secondary)" }}>{new Date(p.published_at || p.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", background: "rgba(34,197,94,0.15)", color: "var(--status-success)", fontSize: 12, fontWeight: 600 }}>Published</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
