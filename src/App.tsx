import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, BookOpen, Camera, ChevronRight, Dice5, Info, MapPinned, Music2, Plus, RotateCcw, ShieldCheck, Sparkles, VolumeX, X } from "lucide-react";
import { CanteenMap } from "./components/CanteenMap";
import { StallPanel } from "./components/StallPanel";
import { Legend } from "./components/Legend";
import { initialStalls } from "./data/stalls";
import { averageDelta, classifyDelta, getStallLevel, getStallSampleCount } from "./glucose";
import type { NewRecordInput, Stall } from "./types";
import {
  fetchMyRecords,
  getStoredSession,
  insertRecord,
  isSupabaseConfigured,
  signInWithEmail,
  signUpWithEmail,
  storeSession,
  type AuthSession,
  type CloudRecord
} from "./lib/supabaseRest";

function applyRecordToStalls(current: Stall[], stallId: string, input: NewRecordInput, options?: { id?: string; createdAt?: string; user?: string }) {
  const peak = input.peak ?? Math.max(input.after1h, input.after2h);
  const delta = Number((peak - input.before).toFixed(1));
  const level = classifyDelta(delta);
  const createdAt = options?.createdAt ?? new Date().toISOString();
  const recordId = options?.id ?? `record-${Date.now()}`;
  const user = options?.user ?? "匿名同事";

  return current.map((stall) => {
    if (stall.id !== stallId) return stall;

    const foodName = input.foodName.trim() || "自定义餐食";
    const foodId = foodName.toLowerCase().replace(/\s+/g, "-") || `food-${Date.now()}`;
    const existingFood = stall.foods.find((food) => food.name === foodName);
    const nextRecord = {
      id: recordId,
      user,
      note: input.note,
      shared: input.shared,
      anonymous: true,
      before: input.before,
      after1h: input.after1h,
      after2h: input.after2h,
      peak,
      delta,
      imageData: input.imageData,
      portion: input.portion,
      extraRice: input.extraRice,
      sugaryDrink: input.sugaryDrink,
      exercised: input.exercised,
      createdAt
    };

    if (!existingFood) {
      return {
        ...stall,
        foods: [
          {
            id: `${stall.id}-${foodId}`,
            name: foodName,
            imageTone: "#94a3b8",
            level,
            before: input.before,
            after1h: input.after1h,
            after2h: input.after2h,
            peak,
            delta,
            sampleCount: 1,
            note: input.note || "新提交记录",
            records: [nextRecord]
          },
          ...stall.foods
        ]
      };
    }

    return {
      ...stall,
      foods: stall.foods.map((food) => {
        if (food.id !== existingFood.id || food.records.some((record) => record.id === recordId)) return food;
        const nextCount = food.sampleCount + 1;
        const nextBefore = Number(((food.before * food.sampleCount + input.before) / nextCount).toFixed(1));
        const nextAfter1h = Number(((food.after1h * food.sampleCount + input.after1h) / nextCount).toFixed(1));
        const nextAfter2h = Number(((food.after2h * food.sampleCount + input.after2h) / nextCount).toFixed(1));
        const nextDelta = Number(((food.delta * food.sampleCount + delta) / nextCount).toFixed(1));
        return {
          ...food,
          before: nextBefore,
          after1h: nextAfter1h,
          after2h: nextAfter2h,
          delta: nextDelta,
          level: classifyDelta(nextDelta),
          sampleCount: nextCount,
          records: [nextRecord, ...food.records]
        };
      })
    };
  });
}

function mergeCloudRecords(records: CloudRecord[]) {
  return records.reduce((nextStalls, record) => {
    const input: NewRecordInput = {
      foodName: record.food_name,
      before: Number(record.before),
      after1h: Number(record.after1h),
      after2h: Number(record.after2h),
      peak: Number((Number(record.before) + Number(record.delta)).toFixed(1)),
      portion: record.portion,
      extraRice: record.extra_rice,
      sugaryDrink: record.sugary_drink,
      exercised: record.exercised,
      note: record.note,
      shared: record.shared
    };
    return applyRecordToStalls(nextStalls, record.stall_id, input, {
      id: record.id,
      createdAt: record.created_at,
      user: "我"
    });
  }, initialStalls);
}

function App() {
  const [stalls, setStalls] = useState<Stall[]>(initialStalls);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeGame, setActiveGame] = useState<"draw" | "album" | null>(null);
  const [selectedFortuneCard, setSelectedFortuneCard] = useState<string | null>(null);
  const [albumFilter, setAlbumFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [bgmOn, setBgmOn] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const cloudReady = isSupabaseConfigured();

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

  useEffect(() => {
    storeSession(session);
    if (!session || !cloudReady) {
      return;
    }

    let cancelled = false;
    setSyncMessage("正在同步云端记录...");
    fetchMyRecords(session)
      .then((records) => {
        if (cancelled) return;
        setStalls(mergeCloudRecords(records));
        setSyncMessage(`已同步 ${records.length} 条我的记录`);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setSyncMessage(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [cloudReady, session]);

  function openGame(game: "draw" | "album") {
    setActiveGame(game);
    setSelectedFortuneCard(null);
    if (game === "album") setAlbumFilter("all");
  }

  async function handleAuth(action: "sign-in" | "sign-up") {
    if (!cloudReady) {
      setAuthMessage("还没有配置 Supabase 环境变量。");
      return;
    }
    if (!authEmail || authPassword.length < 6) {
      setAuthMessage("请输入邮箱和至少 6 位密码。");
      return;
    }
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const nextSession = action === "sign-in"
        ? await signInWithEmail(authEmail, authPassword)
        : await signUpWithEmail(authEmail, authPassword);
      if (!nextSession) {
        setAuthMessage("注册成功。请先去邮箱确认，然后回来登录。");
        return;
      }
      setSession(nextSession);
      setAuthOpen(false);
      setAuthMessage("登录成功，正在同步记录。");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "登录失败，请稍后再试。");
    } finally {
      setAuthBusy(false);
    }
  }

  function handleSignOut() {
    setSession(null);
    setStalls(initialStalls);
    setSyncMessage("");
    setAuthMessage("");
  }

  function stopBgm() {
    if (!bgmRef.current) return;
    bgmRef.current.pause();
    bgmRef.current.currentTime = 0;
    bgmRef.current = null;
    setBgmOn(false);
  }

  function playBgm() {
    if (bgmRef.current) {
      stopBgm();
      return;
    }

    const audio = new Audio("/audio/game-bgm.mp4");
    audio.loop = true;
    audio.volume = 0.42;
    bgmRef.current = audio;
    audio.play()
      .then(() => setBgmOn(true))
      .catch(() => {
        bgmRef.current = null;
        setBgmOn(false);
      });
  }

  useEffect(() => () => stopBgm(), []);

  async function handleAddRecord(input: NewRecordInput) {
    if (!selectedStall) return;
    const peak = input.peak ?? Math.max(input.after1h, input.after2h);
    const delta = Number((peak - input.before).toFixed(1));
    const level = classifyDelta(delta);

    if (session && cloudReady) {
      try {
        const created = await insertRecord(session, {
          stall_id: selectedStall.id,
          stall_name: selectedStall.name,
          food_name: input.foodName.trim() || "自定义餐食",
          before: input.before,
          after1h: input.after1h,
          after2h: input.after2h,
          delta,
          level,
          portion: input.portion,
          extra_rice: input.extraRice,
          sugary_drink: input.sugaryDrink,
          exercised: input.exercised,
          note: input.note,
          shared: input.shared,
          anonymous: true
        });
        setStalls((current) => applyRecordToStalls(current, selectedStall.id, input, {
          id: created.id,
          createdAt: created.created_at,
          user: "我"
        }));
        setSyncMessage("记录已保存到云端");
      } catch (error) {
        setSyncMessage(error instanceof Error ? error.message : "云端保存失败，已先保存在当前页面。");
        setStalls((current) => applyRecordToStalls(current, selectedStall.id, input));
      }
    } else {
      setStalls((current) => applyRecordToStalls(current, selectedStall.id, input));
      setSyncMessage(cloudReady ? "未登录：记录已先保存在当前页面" : "未连接云端：记录已先保存在当前页面");
    }
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
            <button className={`bgm-button ${bgmOn ? "active" : ""}`} type="button" onClick={playBgm} title={bgmOn ? "关闭背景音乐" : "播放背景音乐"}>
              {bgmOn ? <Music2 size={17} /> : <VolumeX size={17} />}
              <span>BGM</span>
            </button>
            <div className="metric">
              <span>{overview.totalSamples}</span>
              <small>匿名样本</small>
            </div>
            <button className="icon-button" title="重置视角" onClick={() => window.dispatchEvent(new Event("reset-camera"))}>
              <RotateCcw size={18} />
            </button>
            <div className="cloud-auth">
              <button className={`cloud-auth-button ${session ? "signed-in" : ""}`} type="button" onClick={() => setAuthOpen((value) => !value)}>
                <ShieldCheck size={16} />
                <span>{session ? "已登录" : "登录"}</span>
              </button>
              {authOpen && (
                <div className="cloud-auth-popover">
                  <strong>{session ? "云端记录已开启" : "登录后同步记录"}</strong>
                  <p>{session ? session.user.email || "当前账号" : cloudReady ? "注册或登录后，别人也能各自保存自己的血糖记录。" : "还没有配置 Supabase，先按下方说明补环境变量。"}</p>
                  {!session ? (
                    <>
                      <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="邮箱" />
                      <input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="密码，至少 6 位" />
                      <div className="cloud-auth-actions">
                        <button type="button" disabled={authBusy} onClick={() => handleAuth("sign-in")}>登录</button>
                        <button type="button" disabled={authBusy} onClick={() => handleAuth("sign-up")}>注册</button>
                      </div>
                    </>
                  ) : (
                    <button className="sign-out-button" type="button" onClick={handleSignOut}>退出登录</button>
                  )}
                  {(authMessage || syncMessage) && <span className="cloud-auth-message">{authMessage || syncMessage}</span>}
                </div>
              )}
            </div>
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
