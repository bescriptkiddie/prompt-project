import { PromptItem } from '@/types';

export const MOCK_PROMPTS: PromptItem[] = [

  {
    "id": "1",
    "title": "3D 百科全书式信息图表",
    "model": "MJ-V6",
    "prompt": "Role & Subject: A massive, encyclopedic 16:9 3D infographic poster titled \"THE EVOLUTION OF [Product Name]\". The visual style is a high-end fusion of museum-grade product photography and complex technical engineering blueprints. The Hero Lineup (Chronological Core): A complete, linear chronological lineup of 8-12 historical versions of [Product Name]... Rendering: Hyper-realistic 3D, 8k resolution... --ar 16:9 --v 6.0 --stylize 300",
    "imageUrl": "https://placehold.co/800x450?text=3D+Infographic",
    "type": "image"
  },
  {
    "id": "2",
    "title": "潮流 OOTD 手绘插画 (Asset Audit版)",
    "model": "Nano Banana Pro",
    "prompt": "核心指令：将上传照片中的人物转换成小红书 City Walk 风格的潮流 OOTD 手绘插画。保持人物特征，但采用更修长、时髦的时尚插画比例（Xiaohongshu Aesthetic）。风格设定：- 构图：竖版构图，潮流穿搭分解图。- 画风：精致手绘马克笔风格... 描边规则：严禁黑色描边...",
    "imageUrl": "https://placehold.co/800x450?text=OOTD+Illustration",
    "type": "image"
  },
  {
    "id": "3",
    "title": "人物转潮流 OOTD 插画 (详细版)",
    "model": "Nano Banana Pro",
    "prompt": "「将我上传照片中的人物转换成潮流 OOTD 手绘插画风格。保持用户照片中的脸部特征、发型、气质，但用更可爱、年轻的潮流插画比例呈现。整体风格要求：竖版构图、潮流穿搭分解图、手绘潮流插画风。背景为柔和浅米黄色纯色... 人物转换规则... 服装生成逻辑... 画面附加 OOTD 分解元素...」",
    "imageUrl": "https://placehold.co/800x450?text=OOTD+Detailed",
    "type": "image"
  },
  {
    "id": "4",
    "title": "卡通风格信息图",
    "model": "Nano Banana Pro",
    "prompt": "Please create a cartoon-style infographic based on the provided content, following these guidelines: - Hand-drawn illustration style, landscape orientation (16:9 aspect ratio). - Include a small number of simple cartoon elements... - All imagery and text must strictly adhere to a hand-drawn style...",
    "imageUrl": "https://placehold.co/800x450?text=Cartoon+Infographic",
    "type": "image"
  },
  {
    "id": "5",
    "title": "日式风铃 Canvas 交互组件",
    "model": "Claude-3.5-Sonnet",
    "prompt": "#角色 你是一位精通 Canvas 动画、Web Audio API 和 CSS3 高级特性的前端创意开发专家。 #目标 编写一个单文件 HTML，实现一个极简、优雅且具有物理交互感的日式玻璃风铃窗景小组件。 #核心需求 1. 核心视觉与结构设计... 2. 物理与动画逻辑... 3. 沉浸式环境系统... 4. 音频设计... 5. 代码质量约束...",
    "imageUrl": "https://placehold.co/800x450?text=Wind+Chime+Code",
    "type": "code"
  },
  {
    "id": "6",
    "title": "盖洛普才干卡片",
    "model": "MJ-V6",
    "prompt": "核心指令：一张现代 UI 设计风格的才干展示卡片，竖构图。插画风格需要遵循 Modern Flat（现代扁平）美学... 主体描述（POV 视角）：画面采用 第一人称视角（First-person view）... 背景与排版：卡片采用“三段式”布局... 配色方案：整体色调以 {主题色} 为主...",
    "imageUrl": "https://placehold.co/800x450?text=Gallup+Card",
    "type": "image"
  },
  {
    "id": "7",
    "title": "鬼灭之刃浮世绘闪卡",
    "model": "MJ-V6",
    "prompt": "核心指令： 一张日式浮世绘风格的收藏级集换式卡牌设计，竖构图。插画风格需要紧密模仿《鬼灭之刃》的视觉美学... 主体描述： 卡牌主角是 {角色名字}... 背景与材质： 背景需融合 纹理化的镭射闪卡（Holographic Foil）效果... 边框： 图片周围要有 日本传统纹样...",
    "imageUrl": "https://placehold.co/800x450?text=Demon+Slayer+Card",
    "type": "image"
  },
  {
    "id": "8",
    "title": "星巴克 Q 版梦幻店铺",
    "model": "MJ-V6",
    "prompt": "3D chibi-style miniature concept store of {Brand Name}, creatively designed with an exterior inspired by the brand's most iconic product or packaging... The store features two floors with large glass windows... Rendered in a miniature cityscape style using Cinema 4D, with a blind-box toy aesthetic... --ar 2:3",
    "imageUrl": "https://placehold.co/800x450?text=Chibi+Store",
    "type": "image"
  },
  {
    "id": "9",
    "title": "九宫格超写实时尚摄影",
    "model": "Nano Banana Pro",
    "prompt": "整体画面设定：画面为竖版三比四比例，单张图固定九宫格布局... 参考图绑定规则：以上传参考图为唯一视觉依据... 九宫格分镜结构... 顶行：整体视角与空间感... 中行：身体重点部位细节... 底行：肢体与配饰细节...",
    "imageUrl": "https://placehold.co/800x450?text=9-Grid+Fashion",
    "type": "image"
  },
  {
    "id": "10",
    "title": "青春拼贴肖像 (Youthful Collage Portrait)",
    "model": "Nano Banana Pro",
    "prompt": "Use this prompt to generate a playful, stylish portrait collage that accurately replicates a person's features from your uploaded photo... Recreate the character's appearance from the uploaded photo... She wears trendy youthful clothing... The background features a corkboard covered with colorful sticky notes... Aspect ratio: 9:16.",
    "imageUrl": "https://placehold.co/800x450?text=Collage+Portrait",
    "type": "image"
  },
  {
    "id": "11",
    "title": "电影取景地打卡",
    "model": "Nano Banana Pro",
    "prompt": "穿越时空⌛️这一次Nano Banana Pro带你来到电影取景地🎬📍 上传参考图+输入电影名称，即可来到当地打卡🛫 中文提示词：选取《你的名字》电影里经典画面的实景，使用参考图中角色（动作符合电影氛围），生成一张超写实风格的旅行照片...",
    "imageUrl": "https://placehold.co/800x450?text=Movie+Location",
    "type": "image"
  },
  {
    "id": "12",
    "title": "超广角重构：姿态与透视极限",
    "model": "Nano Banana Pro",
    "prompt": "极端广角视角与动态姿势的重混编辑。这是一张「在原图基础上进行编辑」的图片... 请将原始图像作为严格参考... 相机与视角：使用超广角或鱼眼感的镜头... 靠近镜头的身体部位... 姿势与整体身体... 整体目标：将原始照片转化为一张戏剧化的、写实的、超广角视角的照片...",
    "imageUrl": "https://placehold.co/800x450?text=Ultra+Wide+Angle",
    "type": "image"
  },
  {
    "id": "13",
    "title": "日本高端写真集扫描风",
    "model": "MJ-V6",
    "prompt": "**[类型]：** 扫描自日本高端写真集（Shashin-shu）的页面。**九宫格照片排版，印制在纹理哑光艺术纸上。**... **[主题一致性 - 严格]：**... **[网格叙事 - “从白天到黑夜”的旅程]：**... **[美学风格]：**... --ar 2:3 --style raw --v 6.0 --stylize 200",
    "imageUrl": "https://placehold.co/800x450?text=Photo+Book+Scan",
    "type": "image"
  },
  {
    "id": "14",
    "title": "疯狂动物城自拍",
    "model": "Nano Banana Pro",
    "prompt": "提示词：创建一张超写实的自拍照。使用我上传的图像作为人物的精确参考... 添加[疯狂动物城兔子警官]（迪士尼角色）站在这位真实人物旁边。场景：黑暗拥挤的电影院... 构图：自拍角度...",
    "imageUrl": "https://placehold.co/800x450?text=Zootopia+Selfie",
    "type": "image"
  },
  {
    "id": "15",
    "title": "法式速写新闻漫画",
    "model": "Nano Banana Pro",
    "prompt": "绘制新闻漫画要求如下：这是一幅模仿法式速写风格的漫画，描绘了面条厂工人“手搓飞机”引发的争议场景。画面左侧是拿着规章制度质疑安全性的监管者，右侧是支持民间发明的围观群众，中间则是正在面粉袋和机器旁造飞机的一个工人。图片上文字都用英语...",
    "imageUrl": "https://placehold.co/800x450?text=French+Cartoon",
    "type": "image"
  }


];
