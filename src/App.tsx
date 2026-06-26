import { useMemo, useState } from "react";
import { Activity, BookOpen, Camera, ChevronRight, Dice5, Info, MapPinned, Plus, RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import { CanteenMap } from "./components/CanteenMap";
import { StallPanel } from "./components/StallPanel";
import { Legend } from "./components/Legend";
import { initialStalls } from "./data/stalls";
import { averageDelta, classifyDelta, getStallLevel, getStallSampleCount } from "./glucose";
import type { NewRecordInput, Stall } from "./types";

function App() {
  const [stalls, setStalls] = useState<Stall[]>(initialStalls);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeGame, setActiveGame] = useState<"draw" | "album" | null>(null);
  const [selectedFortuneCard, setSelectedFortuneCard] = useState<string | null>(null);
  const [albumFilter, setAlbumFilter] = useState<"all" | "low" | "medium" | "high">("all");

  const selectedStall = useMemo(() => stalls.find((stall) => stall.id === selectedId) ?? null, [selectedId, stalls]);
  const overview = useMemo(() => {
    const sorted = stalls
      .map((stall) => ({ stall, level: getStallLevel(stall), samples: getStallSampleCount(stall), delta: averageDelta(stall) }))
      .sort((a, b) => a.delta - b.delta);
    return {
      best: sorted.find((item) => item.level === "low") ?? sorted[0],
      riskiest: [...sorted].reverse().find((item) => item.level === "high") ?? sorted[sorted.length - 1],
      totalSamples: sorted.reduce((sum, item) => sum + item.samples, 0)
    };
  }, [stalls]);
  const fortuneCards = useMemo(() => [
    {
      id: "steady",
      tone: "green",
      title: "低升糖美味",
      result: "稳糖上上签",
      stallId: "xiaowan",
      stallName: "小碗蒸鲜",
      dish: "清蒸鱼 + 青菜 + 半份米饭",
      reason: "蛋白质和蔬菜比例更高，主食可控，预计餐后更平稳。"
    },
    {
      id: "recommend",
      tone: "gold",
      title: "今日推荐",
      result: "清爽能量签",
      stallId: "deyou",
      stallName: "德优选品",
      dish: "鸡胸肉沙拉 + 无糖酸奶杯",
      reason: "清爽轻负担，适合想吃得稳一点的午餐选择。"
    },
    {
      id: "surprise",
      tone: "rose",
      title: "惊喜美味",
      result: "快乐加餐签",
      stallId: "guangwei",
      stallName: "广味三宝",
      dish: "鸡汤面 + 青菜加量",
      reason: "热汤更有满足感，建议减少主食量，让波动更可控。"
    }
  ], []);
  const albumItems = useMemo(
    () =>
      stalls
        .flatMap((stall) =>
          stall.foods.map((food) => ({
            food,
            stall,
            avgDelta: food.delta,
            count: food.sampleCount
          }))
        )
        .filter(({ food }) => albumFilter === "all" || food.level === albumFilter)
        .sort((a, b) => a.avgDelta - b.avgDelta)
        .slice(0, 10),
    [albumFilter, stalls]
  );
  const selectedFortune = fortuneCards.find((card) => card.id === selectedFortuneCard) ?? null;

  function openGame(game: "draw" | "album") {
    setActiveGame(game);
    setSelectedFortuneCard(null);
    if (game === "album") setAlbumFilter("all");
  }

  function handleAddRecord(input: NewRecordInput) {
    if (!selectedStall) return;
    const delta = Number((input.after2h - input.before).toFixed(1));
    const level = classifyDelta(delta);
    setStalls((current) =>
      current.map((stall) => {
        if (stall.id !== selectedStall.id) return stall;
        const foodId = input.foodName.trim().toLowerCase().replace(/\s+/g, "-") || `food-${Date.now()}`;
        const existingFood = stall.foods.find((food) => food.name === input.foodName);
        if (!existingFood) {
          return {
            ...stall,
            foods: [
              {
                id: `${stall.id}-${foodId}`,
                name: input.foodName || "自定义餐食",
                imageTone: "#94a3b8",
                level,
                before: input.before,
                after1h: input.after1h,
                after2h: input.after2h,
                delta,
                sampleCount: 1,
                note: input.note || "新提交记录",
                records: [
                  {
                    id: `record-${Date.now()}`,
                    user: "匿名同事",
                    note: input.note,
                    shared: input.shared,
                    anonymous: true,
                    before: input.before,
                    after1h: input.after1h,
                    after2h: input.after2h,
                    delta,
                    portion: input.portion,
                    extraRice: input.extraRice,
                    sugaryDrink: input.sugaryDrink,
                    exercised: input.exercised,
                    createdAt: new Date().toISOString()
                  }
                ]
              },
              ...stall.foods
            ]
          };
        }

        return {
          ...stall,
          foods: stall.foods.map((food) => {
            if (food.id !== existingFood.id) return food;
            const nextCount = food.sampleCount + 1;
            const nextBefore = Number(((food.before * food.sampleCount + input.before) / nextCount).toFixed(1));
            const nextAfter1h = Number(((food.after1h * food.sampleCount + input.after1h) / nextCount).toFixed(1));
            const nextAfter2h = Number(((food.after2h * food.sampleCount + input.after2h) / nextCount).toFixed(1));
            const nextDelta = Number((nextAfter2h - nextBefore).toFixed(1));
            return {
              ...food,
              before: nextBefore,
              after1h: nextAfter1h,
              after2h: nextAfter2h,
              delta: nextDelta,
              level: classifyDelta(nextDelta),
              sampleCount: nextCount,
              records: [
                {
                  id: `record-${Date.now()}`,
                  user: "匿名同事",
                  note: input.note,
                  shared: input.shared,
                  anonymous: true,
                  before: input.before,
                  after1h: input.after1h,
                  after2h: input.after2h,
                  delta,
                  portion: input.portion,
                  extraRice: input.extraRice,
                  sugaryDrink: input.sugaryDrink,
                  exercised: input.exercised,
                  createdAt: new Date().toISOString()
                },
                ...food.records
              ]
            };
          })
        };
      })
    );
    setShowForm(false);
  }

  return (
    <main className={`app-shell ${selectedStall ? "panel-open" : "map-only"} ${activeGame ? "game-overlay-open" : ""}`}>
      <section className="map-stage">
        <div className="top-bar">
          <div>
            <div className="eyebrow"><MapPinned size={14} /> 一楼公司食堂</div>
            <h1>血糖参考地图</h1>
          </div>
          <div className="top-actions">
            <button className="game-entry draw" type="button" onClick={() => openGame("draw")}>
              <Dice5 size={18} />
              <span>吃饭抽签</span>
            </button>
            <button className="game-entry album" type="button" onClick={() => openGame("album")}>
              <BookOpen size={18} />
              <span>食堂图鉴</span>
            </button>
            <div className="metric">
              <span>{overview.totalSamples}</span>
              <small>匿名样本</small>
            </div>
            <button className="icon-button" title="重置视角" onClick={() => window.dispatchEvent(new Event("reset-camera"))}>
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <CanteenMap stalls={stalls} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setShowForm(false); }} />

        <div className="hud-left">
          <Legend />
          <div className="insight-strip">
            <Activity size={16} />
            <span>低波动推荐：{overview.best.stall.name}</span>
            <ChevronRight size={16} />
          </div>
        </div>

        <div className="privacy-note">
          <ShieldCheck size={14} />
          数据仅供个人健康管理参考，不构成医疗建议
        </div>
        <div className="install-tip">添加到主屏幕后可全屏使用</div>
      </section>

      {selectedStall && (
        <StallPanel
          stall={selectedStall}
          showForm={showForm}
          onToggleForm={() => setShowForm((value) => !value)}
          onSubmit={handleAddRecord}
          onClose={() => {
            setSelectedId(null);
            setShowForm(false);
          }}
        />
      )}

      {activeGame && (
        <div className="game-popover" role="dialog" aria-modal="true" onClick={() => setActiveGame(null)}>
          <div className="game-popover-card" onClick={(event) => event.stopPropagation()}>
            <button className="game-close" type="button" aria-label="关闭" onClick={() => setActiveGame(null)}>
              <X size={16} />
            </button>
            {activeGame === "draw" ? (
              <>
                <div className="game-kicker"><Sparkles size={15} /> 今天吃什么</div>
                <h2>{selectedFortune ? selectedFortune.result : "选择一张饭签"}</h2>
                {!selectedFortune && (
                  <div className="fortune-spin-track" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <i />
                  </div>
                )}
                <div className={`fortune-card-stage ${selectedFortune ? "picked" : ""}`}>
                  {fortuneCards.map((card, index) => {
                    const picked = selectedFortuneCard === card.id;
                    return (
                      <button
                        className={`fortune-card ${card.tone} ${picked ? "picked" : ""} ${selectedFortune && !picked ? "dismissed" : ""}`}
                        key={card.id}
                        type="button"
                        style={{ animationDelay: `${index * 90}ms` }}
                        onClick={() => setSelectedFortuneCard(card.id)}
                      >
                        <div className="fortune-card-inner">
                          <div className="fortune-card-face fortune-card-back">
                            <div className="fortune-ribbon">{card.title}</div>
                            <div className="fortune-dish-icon">
                              <span>?</span>
                            </div>
                            <strong>未解锁</strong>
                            <em>点选饭签</em>
                          </div>
                          <div className="fortune-card-face fortune-card-front">
                            <div className="fortune-ribbon">{card.result}</div>
                            <small>今日推荐档口</small>
                            <strong>{card.stallName}</strong>
                            <p>{card.dish}</p>
                            <em>{card.reason}</em>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedFortune && (
                  <div className="game-actions">
                    <button type="button" onClick={() => setSelectedFortuneCard(null)}>重新选择</button>
                    <button type="button" onClick={() => { setSelectedId(selectedFortune.stallId); setActiveGame(null); }}>查看该档口</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="album-title-board">
                  <BookOpen size={34} />
                  <div>
                    <h2>我的食堂饮食图鉴</h2>
                    <span>已解锁 36 / 128</span>
                  </div>
                </div>
                <div className="album-summary-row">
                  <div><span>总记录次数</span><strong>{overview.totalSamples}</strong><em>次</em></div>
                  <div><span>低升糖记录</span><strong>22</strong><em>次</em></div>
                  <div><span>中升糖记录</span><strong>18</strong><em>次</em></div>
                  <div><span>高升糖记录</span><strong>8</strong><em>次</em></div>
                  <button type="button"><Plus size={18} /> 立即记录</button>
                </div>
                <div className="album-filter-tabs">
                  {[
                    ["all", "全部"],
                    ["low", "低升糖"],
                    ["medium", "中升糖"],
                    ["high", "高升糖"]
                  ].map(([value, label]) => (
                    <button
                      className={albumFilter === value ? "active" : ""}
                      type="button"
                      key={value}
                      onClick={() => setAlbumFilter(value as "all" | "low" | "medium" | "high")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="album-list-table">
                  <div className="album-list-head">
                    <span>排名</span>
                    <span>食物信息</span>
                    <span>所属档口</span>
                    <span>记录次数</span>
                    <span>餐前血糖</span>
                    <span>餐一</span>
                    <span>餐二</span>
                    <span>最高血糖</span>
                    <span>升糖幅度</span>
                  </div>
                  {albumItems.map(({ food, stall }, index) => (
                    <div className={`album-list-row ${food.level}`} key={food.id}>
                      <div className={`album-rank ${index < 3 ? "medal" : ""}`}>{index + 1}</div>
                      <div className="album-food-info">
                        <div className="album-food-thumb" style={{ "--food-tone": food.imageTone } as React.CSSProperties} />
                        <div>
                          <strong>{food.name}</strong>
                          <p>{food.note}</p>
                        </div>
                      </div>
                      <div className="album-stall-cell">
                        <i><span /></i>
                        <span>{stall.name}</span>
                      </div>
                      <b>{food.sampleCount} 次</b>
                      <b>{food.before.toFixed(1)}</b>
                      <b>{food.after1h.toFixed(1)}</b>
                      <b>{food.after2h.toFixed(1)}</b>
                      <b>{Math.max(food.after1h, food.after2h).toFixed(1)}</b>
                      <div className="album-delta">
                        <strong>+{food.delta.toFixed(1)}</strong>
                        <span>{food.level === "low" ? "低升糖" : food.level === "medium" ? "中升糖" : food.level === "high" ? "高升糖" : "样本不足"}</span>
                      </div>
                    </div>
                  ))}
                  {albumItems.length === 0 && (
                    <div className="album-empty">当前分类还没有食物记录</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedStall && (
      <div className="floating-add">
        <button onClick={() => setShowForm(true)}>
          <Plus size={18} />
          新增记录
        </button>
      </div>
      )}

      <div className="camera-placeholder" aria-hidden="true">
        <Camera size={14} />
      </div>

      {selectedStall && (
      <button className="panel-close" aria-label="收起面板" onClick={() => {
        if (showForm) {
          setShowForm(false);
          return;
        }
        setSelectedId(null);
      }}>
        {showForm ? <X size={18} /> : <Info size={18} />}
      </button>
      )}
    </main>
  );
}

export default App;
