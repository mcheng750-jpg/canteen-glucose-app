import { useMemo, useState } from "react";
import type React from "react";
import { Camera, Check, Dumbbell, Filter, Leaf, Plus, Salad, Share2, Star, Utensils, X } from "lucide-react";
import { averageDelta, classifyDelta, getStallLevel, getStallSampleCount, levelMeta } from "../glucose";
import type { NewRecordInput, Stall } from "../types";

type StallPanelProps = {
  stall: Stall;
  showForm: boolean;
  onToggleForm: () => void;
  onSubmit: (input: NewRecordInput) => void;
  onClose: () => void;
};

export function StallPanel({ stall, showForm, onToggleForm, onSubmit, onClose }: StallPanelProps) {
  const level = getStallLevel(stall);
  const meta = levelMeta[level];
  const recordRows = useMemo(
    () =>
      stall.foods
        .flatMap((food) =>
          food.records.map((record) => ({
            ...record,
            foodName: food.name,
            imageTone: food.imageTone,
            note: record.note || food.note,
            level: classifyDelta(record.delta)
          }))
        )
        .sort((a, b) => b.delta - a.delta),
    [stall]
  );
  const recordStats = useMemo(() => {
    const total = recordRows.length;
    const low = recordRows.filter((record) => record.level === "low").length;
    const medium = recordRows.filter((record) => record.level === "medium").length;
    const high = recordRows.filter((record) => record.level === "high").length;
    return { total, low, medium, high };
  }, [recordRows]);

  return (
    <aside className="stall-panel">
      <button className="stall-panel-close" type="button" aria-label="关闭档口详情" onClick={onClose}>
        <X size={20} />
      </button>
      <div className="panel-hero">
        <div className="stall-miniature" style={{ "--stall-tone": meta.color } as React.CSSProperties}>
          <span />
          <i />
          <b />
        </div>
        <div className="panel-title-block">
          <span className="category">{stall.category}</span>
          <h2>{stall.name} <Leaf size={17} /></h2>
          <p>{meta.label}参考 · 用户真实记录</p>
        </div>
        <button className="favorite-button" type="button">
          <Star size={18} />
          收藏
        </button>
      </div>

      <div className="panel-stats game-stats">
        <div><span>总记录次数</span><strong>{recordStats.total || getStallSampleCount(stall)}</strong><em>次</em></div>
        <div><span>低升糖记录</span><strong className="stat-low">{recordStats.low}</strong><em>次</em></div>
        <div><span>正常升糖记录</span><strong className="stat-medium">{recordStats.medium}</strong><em>次</em></div>
        <div><span>高升糖记录</span><strong className="stat-high">{recordStats.high}</strong><em>次</em></div>
        <button className="record-now-button" type="button" onClick={onToggleForm}>
          <Plus size={18} />
          立即记录
        </button>
      </div>

      {showForm && (
        <div className="record-form-shell">
          <RecordForm foods={stall.foods.map((food) => food.name)} onSubmit={onSubmit} />
        </div>
      )}

      <div className="section-title compact record-table-title">
        <span>我的记录列表</span>
        <small>按升糖幅度从高到低</small>
        <button type="button"><Filter size={14} /> 筛选</button>
      </div>
      <div className="record-table">
        <div className="record-table-head">
          <span>食物名称</span>
          <span>餐前血糖</span>
          <span>餐一</span>
          <span>餐二</span>
          <span>最高血糖</span>
          <span>升糖幅度</span>
        </div>
        {recordRows.length === 0 && (
          <div className="empty-records">
            <strong>这个档口还没有真实记录</strong>
            <span>添加第一条记录后，地图颜色会自动更新。</span>
          </div>
        )}
        {recordRows.map((record) => {
          const recordMeta = levelMeta[record.level];
          const peak = Math.max(record.after1h, record.after2h);
          return (
            <article className="record-table-row" key={record.id}>
              <div className="record-food-cell">
                <div className="record-food-image" style={{ background: `linear-gradient(135deg, ${record.imageTone}, #fff8ea)` }}>
                <Utensils size={18} />
              </div>
                <div>
                  <h3>{record.foodName}</h3>
                  <p>{record.note || "匿名同事分享"}</p>
                </div>
              </div>
              <strong>{record.before}</strong>
              <strong>{record.after1h}</strong>
              <strong>{record.after2h}</strong>
              <strong>{peak.toFixed(1)}</strong>
              <div className="delta-cell" style={{ color: recordMeta.color }}>
                <b>+{record.delta}</b>
                <span style={{ backgroundColor: recordMeta.color }}>{recordMeta.label}</span>
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}

function RecordForm({ foods, onSubmit }: { foods: string[]; onSubmit: (input: NewRecordInput) => void }) {
  const [form, setForm] = useState<NewRecordInput>({
    foodName: foods[0] ?? "",
    before: 5.6,
    after1h: 7.8,
    after2h: 7.0,
    portion: "正常",
    extraRice: false,
    sugaryDrink: false,
    exercised: false,
    note: "",
    shared: true
  });

  function update<K extends keyof NewRecordInput>(key: K, value: NewRecordInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="record-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <label>
        食物名称
        <input value={form.foodName} list="food-options" onChange={(event) => update("foodName", event.target.value)} />
        <datalist id="food-options">
          {foods.map((food) => <option key={food} value={food} />)}
        </datalist>
      </label>

      <button className="upload-button" type="button">
        <Camera size={16} />
        上传/拍摄食物图片
      </button>

      <div className="form-grid">
        <label>餐前<input type="number" step="0.1" value={form.before} onChange={(event) => update("before", Number(event.target.value))} /></label>
        <label>1小时<input type="number" step="0.1" value={form.after1h} onChange={(event) => update("after1h", Number(event.target.value))} /></label>
        <label>2小时<input type="number" step="0.1" value={form.after2h} onChange={(event) => update("after2h", Number(event.target.value))} /></label>
      </div>

      <div className="segmented">
        {(["少量", "正常", "加量"] as const).map((portion) => (
          <button key={portion} type="button" className={form.portion === portion ? "active" : ""} onClick={() => update("portion", portion)}>
            {portion}
          </button>
        ))}
      </div>

      <div className="toggles">
        <Toggle icon={<Salad size={15} />} label="加饭" checked={form.extraRice} onChange={(value) => update("extraRice", value)} />
        <Toggle icon={<Share2 size={15} />} label="含糖饮料" checked={form.sugaryDrink} onChange={(value) => update("sugaryDrink", value)} />
        <Toggle icon={<Dumbbell size={15} />} label="饭后运动" checked={form.exercised} onChange={(value) => update("exercised", value)} />
        <Toggle icon={<Check size={15} />} label="匿名分享" checked={form.shared} onChange={(value) => update("shared", value)} />
      </div>

      <label>
        备注
        <textarea value={form.note} rows={2} onChange={(event) => update("note", event.target.value)} placeholder="例如：半份饭、饭后散步 20 分钟" />
      </label>

      <button className="submit-button" type="submit">提交并更新档口状态</button>
    </form>
  );
}

function Toggle({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" className={`toggle ${checked ? "active" : ""}`} onClick={() => onChange(!checked)}>
      {icon}
      {label}
    </button>
  );
}
