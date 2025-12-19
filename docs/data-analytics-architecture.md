# 数据采集与用户画像架构设计

## 一、背景与目标

### 1.1 现状
- ✅ 已有功能：教练提效（会谈路线 + 沟通训练）、Methodology、视频生成、治愈等
- ✅ 技术栈：Next.js + React + Tailwind + OpenAI SDK
- ✅ 当前存储：localStorage（API 密钥、聊天历史、会话状态）
- ❌ 缺失：用户体系、行为追踪、数据分析、用户画像

### 1.2 目标
1. **数据资产沉淀**：在无用户体系的前提下，保留关键行为和内容数据
2. **用户画像构建**：通过匿名 ID + 行为分析，建立教练用户画像
3. **数据大屏展示**：实时监控产品健康度、用户活跃度、内容质量

---

## 二、架构设计原则

### 2.1 核心原则
- **隐私优先**：匿名化处理，不强制登录，符合 GDPR/CCPA
- **渐进式采集**：从客户端开始，逐步过渡到服务端存储
- **最小化干扰**：数据采集不影响用户体验
- **数据驱动**：采集的数据必须可转化为可执行洞察

### 2.2 技术选型考量
| 阶段 | 存储方案 | 数据同步 | 分析工具 |
|------|----------|----------|----------|
| **阶段一**（当前）| localStorage | 无 | 手动导出分析 |
| **阶段二**（2-4周）| PostgreSQL + localStorage | 单向上报 | SQL + Metabase |
| **阶段三**（1-2月）| PostgreSQL + ClickHouse | 双向同步 | ClickHouse + Grafana |
| **阶段四**（3+月）| 全栈分析平台 | 实时流 | 自建数据大屏 |

---

## 三、匿名用户识别策略

### 3.1 设备指纹方案（推荐）

```typescript
// 生成稳定的匿名用户 ID
interface AnonymousUser {
  anonymousId: string;        // UUID v4 (存 localStorage)
  deviceFingerprint: string;  // 设备指纹 (浏览器 + OS + 屏幕等)
  firstSeen: string;          // 首次访问时间
  lastSeen: string;           // 最后活跃时间
}

// 示例实现
function generateAnonymousId(): AnonymousUser {
  const stored = localStorage.getItem('anonymous_user');
  if (stored) return JSON.parse(stored);

  const anonymousId = crypto.randomUUID();
  const fingerprint = generateFingerprint(); // 基于 navigator.userAgent, screen, timezone 等
  
  const user: AnonymousUser = {
    anonymousId,
    deviceFingerprint: fingerprint,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };
  
  localStorage.setItem('anonymous_user', JSON.stringify(user));
  return user;
}

// 设备指纹生成（轻量级，不依赖第三方库）
function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage
  ];
  return hashCode(components.join('|'));
}
```

### 3.2 多端同步策略（可选）

**方案 A：邀请码绑定**
- 用户在设置中生成 6 位邀请码（有效期 24 小时）
- 其他设备输入邀请码，关联同一匿名 ID
- 适用场景：用户主动希望同步数据

**方案 B：云端备份**
- 用户可选择"备份到云端"（需输入邮箱验证）
- 生成备份 Token，其他设备输入 Token 恢复数据
- 邮箱仅用于验证，不作为登录凭证

---

## 四、数据采集策略

### 4.1 数据分类

#### A. 行为数据（Behavioral Data）
| 数据项 | 采集时机 | 存储位置 | 用途 |
|--------|----------|----------|------|
| 功能点击 | 每次点击按钮/Tab | 客户端缓冲 → 后端 | 功能偏好分析 |
| 页面停留时长 | 页面卸载时 | 客户端缓冲 | 用户兴趣度 |
| 会话时长 | 会话结束时 | 后端 | 活跃度指标 |
| 生成次数 | 调用 API 时 | 后端日志 | 使用频率 |
| 错误率 | API 错误时 | 后端日志 | 产品健康度 |

#### B. 内容数据（Content Data）
| 数据项 | 采集时机 | 脱敏处理 | 用途 |
|--------|----------|----------|------|
| 输入材料长度 | 提交表单时 | 仅存长度/字符数 | 内容复杂度分析 |
| 主题标签 | 用户选择时 | 明文存储 | 主题偏好分析 |
| 生成结果摘要 | API 返回时 | 仅存结构化字段（如路线数、域） | 质量分析 |
| 聊天轮次 | 会话结束时 | 仅存数量，不存内容 | 互动深度 |
| 关键词提取 | 后台异步 | TF-IDF 提取 top 5 | 内容趋势 |

#### C. 环境数据（Environmental Data）
| 数据项 | 采集时机 | 存储位置 | 用途 |
|--------|----------|----------|------|
| 设备类型 | 首次访问 | 后端 | 多端优化 |
| 浏览器 | 首次访问 | 后端 | 兼容性分析 |
| 访问时段 | 每次访问 | 后端 | 活跃时段分析 |
| 地理位置（可选） | 用户授权后 | 后端（仅国家/城市级别） | 区域分布 |
| Referrer | 首次访问 | 后端 | 流量来源 |

### 4.2 采集实现示例

```typescript
// 事件追踪客户端（client-side）
class AnalyticsTracker {
  private buffer: Event[] = [];
  private anonymousUser: AnonymousUser;
  private flushInterval = 30000; // 30 秒批量上报

  constructor() {
    this.anonymousUser = generateAnonymousId();
    this.startFlushTimer();
    this.setupPageTracking();
  }

  // 追踪功能使用
  trackFeatureUsage(feature: string, metadata?: Record<string, any>) {
    this.buffer.push({
      type: 'feature_usage',
      anonymousId: this.anonymousUser.anonymousId,
      feature,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  // 追踪 API 调用
  trackApiCall(endpoint: string, success: boolean, duration: number) {
    this.buffer.push({
      type: 'api_call',
      anonymousId: this.anonymousUser.anonymousId,
      endpoint,
      success,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // 追踪会话
  trackSession(feature: string, duration: number, actions: number) {
    this.buffer.push({
      type: 'session',
      anonymousId: this.anonymousUser.anonymousId,
      feature,
      duration,
      actions,
      timestamp: new Date().toISOString()
    });
  }

  // 批量上报到后端
  private async flush() {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
    } catch (e) {
      // 失败时存回 localStorage，下次重试
      const stored = localStorage.getItem('analytics_failed') || '[]';
      const failed = JSON.parse(stored);
      localStorage.setItem('analytics_failed', JSON.stringify([...failed, ...events].slice(-100)));
    }
  }

  private startFlushTimer() {
    setInterval(() => this.flush(), this.flushInterval);
    window.addEventListener('beforeunload', () => this.flush());
  }

  private setupPageTracking() {
    // 页面停留时长
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const duration = Date.now() - startTime;
      this.trackFeatureUsage('page_view', {
        page: window.location.pathname,
        duration
      });
      this.flush();
    });
  }
}

// 全局实例
export const analytics = new AnalyticsTracker();
```

### 4.3 关键埋点位置

#### 教练提效模块
```typescript
// 会谈路线生成
analytics.trackFeatureUsage('coach_routes_generate', {
  domain: domain || 'auto',
  routeCount,
  materialLength: material.length,
  hasAttachments: attachments.length > 0,
  model
});

// 沟通训练会话
analytics.trackSession('communication_course', sessionDuration, messageCount);

// 导出功能
analytics.trackFeatureUsage('export', { format: 'markdown' | 'html' });

// 历史记录操作
analytics.trackFeatureUsage('history_action', { action: 'load' | 'delete' | 'new' });
```

#### Methodology 模块
```typescript
analytics.trackFeatureUsage('methodology_chat', {
  messageLength: message.length,
  responseTime: duration
});
```

#### 视频生成模块
```typescript
analytics.trackFeatureUsage('video_generate', {
  duration: video.duration,
  format: video.format
});
```

---

## 五、数据存储架构

### 5.1 数据库设计（PostgreSQL）

#### 5.1.1 用户表（anonymous_users）
```sql
CREATE TABLE anonymous_users (
  id SERIAL PRIMARY KEY,
  anonymous_id VARCHAR(36) UNIQUE NOT NULL,
  device_fingerprint VARCHAR(64),
  first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  total_sessions INT DEFAULT 0,
  total_events INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anonymous_id ON anonymous_users(anonymous_id);
CREATE INDEX idx_last_seen ON anonymous_users(last_seen);
```

#### 5.1.2 事件表（events）
```sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  anonymous_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'feature_usage', 'api_call', 'session'
  event_name VARCHAR(100),         -- 具体功能名，如 'coach_routes_generate'
  metadata JSONB,                  -- 事件附加数据
  success BOOLEAN DEFAULT TRUE,
  duration_ms INT,                 -- API 调用耗时或会话时长
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anonymous_id ON events(anonymous_id);
CREATE INDEX idx_event_type ON events(event_type);
CREATE INDEX idx_timestamp ON events(timestamp);
CREATE INDEX idx_event_name ON events(event_name);
```

#### 5.1.3 会话表（sessions）
```sql
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  anonymous_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) UNIQUE NOT NULL,
  feature VARCHAR(50) NOT NULL,    -- 'coach_routes', 'communication_course', 'methodology'
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_sec INT,                -- 会话总时长（秒）
  action_count INT DEFAULT 0,      -- 会话中的操作次数
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anonymous_id ON sessions(anonymous_id);
CREATE INDEX idx_feature ON sessions(feature);
CREATE INDEX idx_started_at ON sessions(started_at);
```

#### 5.1.4 内容摘要表（content_summaries）
```sql
CREATE TABLE content_summaries (
  id BIGSERIAL PRIMARY KEY,
  anonymous_id VARCHAR(36) NOT NULL,
  feature VARCHAR(50) NOT NULL,
  summary_type VARCHAR(50) NOT NULL, -- 'input', 'output', 'chat_session'
  
  -- 结构化字段（不存原始内容）
  char_count INT,
  word_count INT,
  keywords TEXT[],                   -- 提取的关键词数组
  topics TEXT[],                     -- 主题标签
  sentiment VARCHAR(20),             -- 'positive', 'neutral', 'negative'（可选）
  
  metadata JSONB,                    -- 其他结构化数据（如路线数、域等）
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anonymous_id ON content_summaries(anonymous_id);
CREATE INDEX idx_feature ON content_summaries(feature);
CREATE INDEX idx_keywords ON content_summaries USING GIN(keywords);
```

### 5.2 ClickHouse（时序数据，阶段三）

适用于大规模事件流分析和实时聚合查询。

```sql
CREATE TABLE events_stream (
  timestamp DateTime,
  anonymous_id String,
  event_type LowCardinality(String),
  event_name LowCardinality(String),
  metadata String,  -- JSON string
  success UInt8,
  duration_ms UInt32,
  date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, anonymous_id, timestamp);

-- 物化视图：每日活跃用户
CREATE MATERIALIZED VIEW daily_active_users
ENGINE = SummingMergeTree()
ORDER BY (date, event_type)
AS SELECT
  toDate(timestamp) AS date,
  event_type,
  uniqExact(anonymous_id) AS dau
FROM events_stream
GROUP BY date, event_type;
```

---

## 六、用户画像体系

### 6.1 画像维度设计

#### A. 基础属性（Demographic）
- 设备类型：Desktop / Mobile / Tablet
- 浏览器：Chrome / Safari / Firefox / Edge
- 地理位置：国家 / 城市（可选，用户授权后）
- 首次访问时间：注册天数

#### B. 行为属性（Behavioral）
| 维度 | 指标 | 计算逻辑 | 用途 |
|------|------|----------|------|
| 活跃度 | DAU / MAU / 留存率 | 基于 last_seen | 识别高价值用户 |
| 使用频率 | 每周访问次数 | COUNT(DISTINCT date) | 用户分层 |
| 功能偏好 | Top 3 功能 | GROUP BY event_name | 个性化推荐 |
| 深度用户 | 会话时长 > 10 分钟 | AVG(duration_sec) | 找到核心用户 |
| 流失风险 | 7 天未活跃 | last_seen < NOW() - INTERVAL '7 days' | 召回策略 |

#### C. 内容属性（Content）
| 维度 | 指标 | 计算逻辑 | 用途 |
|------|------|----------|------|
| 主题偏好 | Top 3 关键词 | 从 content_summaries 提取 | 内容推荐 |
| 盖洛普域偏好 | 最常用的域 | GROUP BY metadata->>'domain' | 个性化配置 |
| 输入复杂度 | 平均材料长度 | AVG(char_count) | 技能水平评估 |
| 互动深度 | 平均聊天轮次 | AVG(metadata->>'message_count') | 使用成熟度 |

#### D. 生命周期阶段（Lifecycle Stage）
```sql
-- 用户分层逻辑
CASE
  WHEN total_sessions = 0 THEN 'visitor'           -- 访客
  WHEN total_sessions <= 3 THEN 'new_user'         -- 新用户
  WHEN total_sessions > 10 AND last_seen > NOW() - INTERVAL '7 days' THEN 'power_user'  -- 核心用户
  WHEN last_seen < NOW() - INTERVAL '30 days' THEN 'churned'  -- 流失用户
  ELSE 'casual_user'                               -- 普通用户
END AS lifecycle_stage
```

### 6.2 画像标签体系

#### 自动化标签（基于行为数据）
```json
{
  "anonymous_id": "550e8400-e29b-41d4-a716-446655440000",
  "tags": {
    "lifecycle": "power_user",
    "feature_preference": ["coach_routes", "communication_course"],
    "activity_level": "high",               // high / medium / low
    "skill_level": "advanced",              // beginner / intermediate / advanced
    "domain_preference": "Relationship Building",
    "usage_pattern": "evening_user",        // morning / afternoon / evening / night
    "device_type": "desktop",
    "churn_risk": "low"                     // low / medium / high
  },
  "metrics": {
    "total_sessions": 47,
    "total_events": 312,
    "avg_session_duration_min": 15.3,
    "days_active": 28,
    "last_active": "2025-12-18T20:45:00Z",
    "retention_7d": 0.85,
    "feature_usage": {
      "coach_routes": 32,
      "communication_course": 18,
      "methodology": 5
    }
  },
  "content_insights": {
    "top_keywords": ["empathy", "boundary", "conflict"],
    "top_topics": ["Relationship Building", "Empathy", "Harmony"],
    "avg_input_length": 1250
  },
  "computed_at": "2025-12-19T10:00:00Z"
}
```

### 6.3 画像计算流程

```typescript
// 定时任务（每小时执行）
async function computeUserProfile(anonymousId: string): Promise<UserProfile> {
  // 1. 基础统计
  const user = await db.query(`
    SELECT 
      anonymous_id,
      first_seen,
      last_seen,
      total_sessions,
      total_events
    FROM anonymous_users
    WHERE anonymous_id = $1
  `, [anonymousId]);

  // 2. 行为指标
  const behaviorMetrics = await db.query(`
    SELECT 
      event_name,
      COUNT(*) as count,
      AVG(duration_ms) as avg_duration
    FROM events
    WHERE anonymous_id = $1
      AND timestamp > NOW() - INTERVAL '30 days'
    GROUP BY event_name
    ORDER BY count DESC
    LIMIT 10
  `, [anonymousId]);

  // 3. 内容洞察
  const contentInsights = await db.query(`
    SELECT 
      unnest(keywords) as keyword,
      COUNT(*) as frequency
    FROM content_summaries
    WHERE anonymous_id = $1
    GROUP BY keyword
    ORDER BY frequency DESC
    LIMIT 10
  `, [anonymousId]);

  // 4. 生命周期阶段
  const lifecycleStage = computeLifecycleStage(user, behaviorMetrics);

  // 5. 流失风险
  const churnRisk = computeChurnRisk(user.last_seen, user.total_sessions);

  return {
    anonymousId,
    tags: {
      lifecycle: lifecycleStage,
      featurePreference: behaviorMetrics.slice(0, 3).map(m => m.event_name),
      churnRisk,
      // ... 其他标签
    },
    metrics: {
      totalSessions: user.total_sessions,
      // ... 其他指标
    },
    contentInsights: {
      topKeywords: contentInsights.map(c => c.keyword),
      // ... 其他洞察
    },
    computedAt: new Date().toISOString()
  };
}
```

---

## 七、数据大屏设计

### 7.1 核心指标体系

#### A. 产品健康度（Product Health）
| 指标 | 定义 | 目标值 | 数据源 |
|------|------|--------|--------|
| DAU | 日活跃用户数 | 持续增长 | events.timestamp |
| MAU | 月活跃用户数 | > 1000 | events.timestamp |
| DAU/MAU 比 | 用户粘性 | > 0.2 | 计算得出 |
| 次日留存率 | D1 Retention | > 40% | sessions.started_at |
| 7 日留存率 | D7 Retention | > 20% | sessions.started_at |
| 30 日留存率 | D30 Retention | > 10% | sessions.started_at |

#### B. 功能使用分布（Feature Usage）
| 指标 | 定义 | 数据源 |
|------|------|--------|
| 功能使用排行 | TOP 10 功能及使用次数 | events.event_name |
| 功能渗透率 | 使用过该功能的用户占比 | 计算得出 |
| 平均会话时长 | 按功能分组 | sessions.duration_sec |
| API 成功率 | 按 endpoint 分组 | events.success |
| 平均 API 响应时间 | 按 endpoint 分组 | events.duration_ms |

#### C. 内容质量指标（Content Quality）
| 指标 | 定义 | 数据源 |
|------|------|--------|
| 平均输入长度 | 用户材料的平均字符数 | content_summaries.char_count |
| 热门主题分布 | TOP 10 关键词及频次 | content_summaries.keywords |
| 盖洛普域分布 | 各域的使用比例 | events.metadata->>'domain' |
| 导出率 | 导出次数 / 生成次数 | events.event_name |

#### D. 用户画像分布（User Segmentation）
| 指标 | 定义 | 数据源 |
|------|------|--------|
| 生命周期阶段分布 | 各阶段用户数 | 计算得出 |
| 设备类型分布 | Desktop / Mobile / Tablet | anonymous_users.metadata |
| 活跃时段分布 | 按小时统计活跃度 | events.timestamp |
| 流失风险分布 | 高/中/低风险用户数 | 计算得出 |

### 7.2 大屏布局设计

#### 整体布局（4K 显示器，16:9）
```
┌─────────────────────────────────────────────────────────────┐
│  Logo                    数据大屏 - 实时监控           刷新时间 │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│   实时 DAU   │    MAU      │  7日留存率   │   API 成功率        │
│    342      │   1,247     │   34.5%     │    98.7%           │
│  ↑ 12%      │  ↑ 8%       │  ↑ 2.3%     │   ↓ 0.5%           │
├─────────────┴─────────────┴─────────────┴─────────────────────┤
│                                                                │
│  【用户增长趋势】（折线图，30天）                                │
│   DAU / MAU 曲线                                               │
│                                                                │
├────────────────────────┬───────────────────────────────────────┤
│ 【功能使用排行】        │  【用户生命周期分布】（饼图）          │
│  1. 会谈路线生成  2,345│   - 访客: 15%                         │
│  2. 沟通训练      1,892│   - 新用户: 25%                       │
│  3. Methodology     987│   - 普通用户: 35%                     │
│  4. 视频生成        456│   - 核心用户: 20%                     │
│  5. 治愈功能        234│   - 流失用户: 5%                      │
│                        │                                       │
├────────────────────────┼───────────────────────────────────────┤
│ 【热门主题云图】        │  【活跃时段热力图】（24小时）          │
│  Empathy • Boundary •  │   08:00 ████████                      │
│  Harmony • Relator •   │   12:00 ██████████                    │
│  Conflict • Leadership │   18:00 ██████████████                │
│                        │   22:00 ████████                      │
├────────────────────────┴───────────────────────────────────────┤
│ 【实时事件流】（最近 10 条）                                    │
│  [18:23:45] 用户 a3f2... 完成会谈路线生成（Relationship Building）│
│  [18:22:31] 用户 b7e9... 开始沟通训练会话                       │
│  [18:21:18] 用户 c2d4... 导出 Markdown                         │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 大屏技术实现

#### 前端技术栈
- **框架**：Next.js + React
- **图表库**：ECharts / Recharts（推荐 ECharts，更强大）
- **实时更新**：WebSocket / Server-Sent Events（SSE）
- **数据获取**：SWR（自动定时刷新）

#### 后端 API
```typescript
// GET /api/dashboard/metrics
interface DashboardMetrics {
  realtime: {
    dau: number;
    dauChange: number;  // 同比昨日变化百分比
    mau: number;
    mauChange: number;
    retention7d: number;
    retention7dChange: number;
    apiSuccessRate: number;
    apiSuccessRateChange: number;
  };
  
  trends: {
    // 最近 30 天 DAU/MAU
    dates: string[];
    dau: number[];
    mau: number[];
  };
  
  featureUsage: Array<{
    feature: string;
    count: number;
    percentage: number;
  }>;
  
  userSegmentation: {
    visitor: number;
    newUser: number;
    casualUser: number;
    powerUser: number;
    churned: number;
  };
  
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
  
  hourlyHeatmap: number[];  // 24 个元素，表示各小时活跃度
  
  recentEvents: Array<{
    timestamp: string;
    anonymousId: string;
    eventName: string;
    metadata?: any;
  }>;
}

// 实现
export async function GET(req: Request) {
  const metrics = await Promise.all([
    computeRealtimeMetrics(),
    computeTrends(),
    computeFeatureUsage(),
    computeUserSegmentation(),
    computeTopKeywords(),
    computeHourlyHeatmap(),
    getRecentEvents(10)
  ]);

  return NextResponse.json({
    realtime: metrics[0],
    trends: metrics[1],
    featureUsage: metrics[2],
    userSegmentation: metrics[3],
    topKeywords: metrics[4],
    hourlyHeatmap: metrics[5],
    recentEvents: metrics[6]
  });
}
```

---

## 八、隐私与合规

### 8.1 数据最小化原则

**不采集的数据：**
- ❌ 完整聊天内容（仅存轮次、长度）
- ❌ 完整输入材料（仅存长度、关键词）
- ❌ IP 地址（仅存国家/城市级别地理位置，且需用户授权）
- ❌ 精确的设备指纹（仅存 hash 值）
- ❌ 邮箱/手机号（除非用户主动提供用于备份）

**仅采集的数据：**
- ✅ 匿名 ID（UUID）
- ✅ 行为事件（功能点击、API 调用）
- ✅ 结构化摘要（字符数、关键词、主题标签）
- ✅ 环境信息（设备类型、浏览器类型、访问时段）

### 8.2 用户知情同意

#### Cookie Banner（首次访问时显示）
```
我们使用匿名追踪来改进产品体验。我们不会收集您的个人信息或聊天内容。

[了解更多] [接受] [拒绝]
```

#### 隐私政策要点
1. **数据采集范围**：功能使用、会话时长、内容长度统计（不含原文）
2. **数据用途**：产品优化、用户画像、数据分析
3. **数据保留**：事件数据保留 90 天，聚合数据永久保留
4. **用户权利**：可随时清除本地数据，可申请删除后端数据
5. **数据共享**：不与第三方共享

### 8.3 数据脱敏与加密

#### 存储时脱敏
```typescript
// 关键词提取（替代存储原文）
function extractKeywords(text: string): string[] {
  // 使用 TF-IDF 或简单词频统计
  const words = tokenize(text);
  const topWords = computeTopK(words, 5);
  return topWords;
}

// 仅存储摘要
const summary = {
  charCount: material.length,
  wordCount: countWords(material),
  keywords: extractKeywords(material),
  // 原始材料不存储
};
```

#### 传输时加密
- 使用 HTTPS（TLS 1.3）
- 敏感字段（如备份 Token）使用 AES-256 加密

---

## 九、技术实施路径

### 阶段一：客户端增强（Week 1-2）

#### 目标
- 建立匿名用户识别体系
- 在客户端完成基础埋点
- 数据先存 localStorage，支持手动导出

#### 任务清单
- [ ] 实现 `AnonymousUser` 生成和存储逻辑
- [ ] 创建 `AnalyticsTracker` 类（客户端）
- [ ] 在关键位置添加埋点：
  - [ ] 会谈路线生成
  - [ ] 沟通训练会话
  - [ ] Methodology 聊天
  - [ ] 导出功能
  - [ ] 历史记录操作
- [ ] 添加事件缓冲和批量上报逻辑（先存本地，阶段二对接后端）
- [ ] 实现"导出数据"功能（JSON 格式，供用户备份）

#### 产出
- 用户可在设置页看到自己的匿名 ID
- 用户可导出自己的使用数据（JSON 文件）
- 为阶段二打好基础

---

### 阶段二：后端接入（Week 3-4）

#### 目标
- 搭建后端数据接收 API
- 建立 PostgreSQL 数据库
- 实现基础数据查询和分析

#### 任务清单
- [ ] 创建 PostgreSQL 数据库和表结构
- [ ] 实现 `/api/analytics/track` 接口（接收批量事件）
- [ ] 实现 `/api/analytics/profile/:anonymousId` 接口（查询用户画像）
- [ ] 修改前端 `AnalyticsTracker`，对接后端 API
- [ ] 实现失败重试机制（localStorage 作为缓冲）
- [ ] 添加数据库索引优化查询性能
- [ ] 创建定时任务（cron job）计算用户画像
- [ ] 实现基础 SQL 查询（DAU/MAU/留存率）

#### 产出
- 后端可持久化存储事件数据
- 管理员可通过 SQL 查询基础指标
- 用户画像开始自动计算

---

### 阶段三：分析与可视化（Week 5-8）

#### 目标
- 搭建数据分析基础设施
- 实现数据大屏
- 支持高级用户画像

#### 任务清单
- [ ] 引入 ClickHouse 处理时序数据（可选）
- [ ] 实现 `/api/dashboard/metrics` 接口
- [ ] 创建数据大屏前端页面（`/dashboard`）
- [ ] 集成 ECharts 实现各类图表：
  - [ ] 用户增长趋势（折线图）
  - [ ] 功能使用排行（柱状图）
  - [ ] 用户生命周期分布（饼图）
  - [ ] 热门主题云图（词云）
  - [ ] 活跃时段热力图（热力图）
- [ ] 实现实时数据推送（SSE 或 WebSocket）
- [ ] 添加数据导出功能（管理员可下载 CSV）
- [ ] 实现高级画像标签（流失风险、技能水平等）

#### 产出
- 管理员可通过数据大屏实时监控产品健康度
- 可基于用户画像进行精准运营

---

### 阶段四：智能化运营（Week 9+）

#### 目标
- 基于数据驱动用户增长
- 实现个性化推荐
- 自动化运营策略

#### 任务清单
- [ ] 实现个性化首页推荐（基于功能偏好）
- [ ] 实现流失用户召回机制（邮件/通知）
- [ ] 添加 A/B 测试框架
- [ ] 实现智能提示（根据用户行为推荐功能）
- [ ] 添加用户反馈收集机制
- [ ] 实现数据驱动的产品迭代决策

---

## 十、成本与收益分析

### 10.1 技术成本

| 阶段 | 人力成本 | 基础设施成本/月 | 总成本 |
|------|----------|-----------------|--------|
| 阶段一 | 1 周开发 | $0（纯前端） | ~ $2,000 |
| 阶段二 | 2 周开发 | $20（PostgreSQL @ Supabase/Render） | ~ $4,500 |
| 阶段三 | 4 周开发 | $50（+ ClickHouse @ ClickHouse Cloud） | ~ $9,000 |
| 阶段四 | 持续迭代 | $100（+ 邮件服务 + CDN） | 持续投入 |

### 10.2 预期收益

#### 产品层面
- **精准优化**：基于数据识别低使用功能，优化或下线
- **用户体验**：发现用户痛点，针对性改进
- **留存提升**：通过流失预警，主动召回用户（预计提升 15-20% 留存率）

#### 商业层面
- **用户增长**：数据驱动的增长策略（预计提升 30% DAU 增长率）
- **变现基础**：为后续会员制/付费功能提供数据支撑
- **融资故事**：数据大屏是投资人最爱看的内容

---

## 十一、风险与缓解

### 11.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 数据库性能瓶颈 | 高 | 中 | 引入 ClickHouse 分担查询压力；添加 Redis 缓存 |
| 前端埋点影响性能 | 中 | 低 | 异步上报 + 批量发送 + 失败时存 localStorage |
| 隐私投诉 | 高 | 低 | 透明的隐私政策 + 用户可随时退出 |
| 数据丢失 | 高 | 低 | 定期备份 + 主从复制 |

### 11.2 合规风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| GDPR 违规 | 高 | 匿名化处理 + 用户授权 + 数据删除权 |
| CCPA 违规 | 中 | 明确告知数据用途 + 提供退出机制 |
| Cookie 合规 | 低 | 添加 Cookie Banner + 用户同意 |

---

## 十二、总结与建议

### 12.1 核心要点

1. **从匿名开始**：无需用户注册，通过 UUID + 设备指纹建立身份
2. **渐进式实施**：先客户端埋点，再后端存储，最后数据分析
3. **隐私优先**：不存原始内容，仅存结构化摘要
4. **数据驱动**：基于真实数据优化产品，而非拍脑袋决策

### 12.2 优先级建议

**立即开始（阶段一）：**
- 匿名用户识别
- 关键功能埋点
- 本地数据缓冲

**3 个月内（阶段二 + 三）：**
- 后端数据存储
- 基础数据分析
- 数据大屏上线

**6 个月内（阶段四）：**
- 个性化推荐
- 智能化运营
- A/B 测试

### 12.3 成功指标

- **3 个月后**：DAU 增长 30%，7 日留存率 > 30%
- **6 个月后**：MAU > 3000，核心用户占比 > 15%
- **1 年后**：数据驱动的功能优化带来 50% 用户满意度提升

---

## 附录

### A. 相关技术文档
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [ClickHouse 官方文档](https://clickhouse.com/docs/)
- [ECharts 图表库](https://echarts.apache.org/)
- [SWR 数据获取库](https://swr.vercel.app/)

### B. 开源参考项目
- [PostHog](https://github.com/PostHog/posthog)：开源产品分析平台
- [Plausible](https://github.com/plausible/analytics)：隐私友好的网站分析工具
- [Umami](https://github.com/umami-software/umami)：轻量级网站统计

### C. 数据脱敏算法
- **关键词提取**：TF-IDF、TextRank
- **文本相似度**：余弦相似度、Jaccard 相似度
- **聚类分析**：K-Means、DBSCAN

---

**文档版本**：v1.0  
**创建日期**：2025-12-19  
**维护者**：产品 + 技术团队  
**下次审阅**：2026-01-19
