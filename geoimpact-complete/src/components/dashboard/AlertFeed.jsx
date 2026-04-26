import { AlertTriangle, Info, ShieldAlert, Activity } from "lucide-react";
import { toRelativeTime } from "@/src/utils/aqiUtils";

const iconByLevel = {
  danger: ShieldAlert,
  warning: AlertTriangle,
  info: Info
};

export default function AlertFeed({ items = [], limit = 3 }) {
  return (
    <div className="card alert-feed">
      <h3>🚨 Recent Alerts</h3>
      <div className="stack">
        {items.slice(0, limit).map((item, idx) => {
          const Icon = iconByLevel[item.level] || Info;
          return (
            <div key={item.url || idx} className="row alert-row">
              <div className="alert-icon-wrapper">
                <Icon size={18} className={`icon-${item.level || "info"}`} />
                <div className="alert-pulse"></div>
              </div>
              <div className="alert-content">
                <div className="alert-title">{item.title}</div>
                <div className="alert-time">
                  <Activity size={12} className="time-icon" />
                  {toRelativeTime(item.publishedAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
