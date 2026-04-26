import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { toRelativeTime } from "@/src/utils/aqiUtils";

const iconMap = { danger: ShieldAlert, warning: AlertTriangle, info: Info };

export default function AirQualityAlerts({ articles = [] }) {
  const totals = articles.reduce((acc, item) => {
    acc[item.level] += 1;
    return acc;
  }, { danger: 0, warning: 0, info: 0 });

  return (
    <div className="card">
      <h3>Air Quality Alerts</h3>
      <div className="grid grid-3">
        <div className="metric-card soft"><div className="metric-label">Danger</div><div className="metric-value">{totals.danger}</div></div>
        <div className="metric-card soft"><div className="metric-label">Warning</div><div className="metric-value">{totals.warning}</div></div>
        <div className="metric-card soft"><div className="metric-label">Info</div><div className="metric-value">{totals.info}</div></div>
      </div>
      <div className="stack mt-12">
        {articles.map((article, idx) => {
          const Icon = iconMap[article.level] || Info;
          const content = (
            <div className="row">
              <Icon size={16} className={`icon-${article.level}`} />
              <div>
                <div>{article.title}</div>
                <div className="small-muted">{article.description}</div>
              </div>
              <div className="small-muted">{toRelativeTime(article.publishedAt)}</div>
            </div>
          );
          return (
            article.url ? (
              <a key={article.url || idx} href={article.url} target="_blank" className="alert-link" rel="noreferrer">
                {content}
              </a>
            ) : (
              <div key={idx} className="alert-link">
                {content}
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}
