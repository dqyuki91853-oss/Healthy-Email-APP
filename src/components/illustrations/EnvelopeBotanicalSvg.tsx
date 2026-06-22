interface Props {
  square?: boolean
  keywords?: string[]
}

function hasKeyword(keywords: string[], ...needles: string[]): boolean {
  const joined = keywords.join(' ')
  return needles.some((n) => joined.includes(n))
}

/**
 * 果蔬与鲜花装饰 — 更密、更真实、环绕信封轮廓。
 * 始终显示基础花带 + 根据关键词激活特定植物组。
 */
export function EnvelopeBotanicalSvg({ square = false, keywords = [] }: Props) {
  if (!square) return <LegacyBotanical />

  const showCitrus = hasKeyword(keywords, '橙', '柚', '橘', '蜜', '金盏', '向日', '蜜瓜')
  const showBerry = hasKeyword(keywords, '莓', '浆', '葡', '野', '虹色')
  const showLeafy = hasKeyword(keywords, '薄荷', '荷', '绿', '青', '山药', '栗', '青梅')
  const showMorningGlory = hasKeyword(keywords, '牵牛', '晨雾', '雾', '铃兰', '紫藤', '波斯', '紫云')

  return (
    <g className="envelope-botanical-svg" aria-hidden>
      <clipPath id="env-botanical-clip">
        <path d="M48 118 Q180 32 180 28 Q180 32 312 118 L312 382 Q312 396 298 396 L62 396 Q48 396 48 382 Z" />
      </clipPath>

      <g clipPath="url(#env-botanical-clip)">
        {/* ── 背景：柔光晕影 ── */}
        <ellipse cx="160" cy="360" rx="160" ry="60" fill="#82B29B" opacity="0.08" />
        <ellipse cx="200" cy="140" rx="100" ry="50" fill="#EBC97F" opacity="0.06" />

        {/* ── 左上：牵牛花藤蔓 (浓密版) ── */}
        {showMorningGlory && (
          <MorningGloryDense />
        )}

        {/* ── 右上：浆果串 (浓密版) ── */}
        {showBerry && (
          <BerryClusterDense />
        )}

        {/* ── 右下：柑橘切片 + 小果 ── */}
        {showCitrus && (
          <CitrusCluster />
        )}

        {/* ── 左下：鲜叶 + 薄荷 ── */}
        {showLeafy && (
          <LeafyCluster />
        )}

        {/* ── 通用花带 (始终显示) — 更密 ── */}
        <BaseFlowerRibbon />

        {/* ── 三角盖内：小花簇 ── */}
        <FlapFlowers />
      </g>
    </g>
  )
}

/** 左上牵牛花藤 — 更浓密 */
function MorningGloryDense() {
  return (
    <g className="envelope-botanical__cluster--left">
      {/* 主藤 */}
      <path
        d="M52 390 Q58 340 50 290 Q44 240 56 190 Q62 160 68 130"
        stroke="#6FA888" strokeWidth="2.2" fill="none" opacity="0.55"
      />
      {/* 侧枝 */}
      <path
        d="M50 290 Q70 280 82 270"
        stroke="#7FBA98" strokeWidth="1.4" fill="none" opacity="0.4"
      />
      <path
        d="M54 200 Q76 195 88 200"
        stroke="#7FBA98" strokeWidth="1.2" fill="none" opacity="0.35"
      />
      {/* 花 1 — 蓝紫色牵牛 */}
      <g transform="translate(50, 340)">
        <circle cx="7" cy="7" r="12" fill="#8CB4E8" opacity="0.85" />
        <circle cx="7" cy="7" r="4.5" fill="#FDF8F0" />
        <path d="M2 3 L7 12 L12 3" fill="#6B9FD0" opacity="0.5" />
      </g>
      {/* 花 2 — 紫色铃兰 */}
      <g transform="translate(44, 305)">
        <circle cx="0" cy="0" r="10" fill="#A88BE0" opacity="0.82" />
        <circle cx="0" cy="0" r="3.5" fill="#FAF5FF" />
        <circle cx="3" cy="-2" r="1.5" fill="#FFFAE8" opacity="0.7" />
      </g>
      {/* 花 3 — 粉色小花 */}
      <g transform="translate(58, 275)">
        <circle cx="0" cy="0" r="9" fill="#E898B8" opacity="0.88" />
        <circle cx="0" cy="0" r="3" fill="#FFF5F8" />
      </g>
      {/* 花 4 — 淡紫 */}
      <g transform="translate(48, 250)">
        <circle cx="0" cy="0" r="8" fill="#C0A0E8" opacity="0.8" />
        <circle cx="0" cy="0" r="3" fill="#FAF0FF" />
      </g>
      {/* 花 5 — 蓝 */}
      <g transform="translate(65, 210)">
        <circle cx="0" cy="0" r="7" fill="#7BA8D8" opacity="0.78" />
        <circle cx="0" cy="0" r="2.5" fill="#F0F4FA" />
      </g>
      {/* 叶 */}
      <ellipse cx="38" cy="370" rx="22" ry="12" fill="#82B29B" opacity="0.22" />
      <ellipse cx="76" cy="280" rx="16" ry="10" fill="#7AB892" opacity="0.18" />
    </g>
  )
}

/** 右上浆果簇 — 更浓密 */
function BerryClusterDense() {
  return (
    <g className="envelope-botanical__cluster--right">
      {/* 主茎 */}
      <path
        d="M310 390 Q304 340 308 290 Q312 240 300 190 Q296 155 290 135"
        stroke="#6FA888" strokeWidth="2" fill="none" opacity="0.5"
      />
      {/* 侧枝 */}
      <path
        d="M308 290 Q288 280 275 275"
        stroke="#7FBA98" strokeWidth="1.3" fill="none" opacity="0.38"
      />
      {/* 葡萄串 1 */}
      <circle cx="300" cy="350" r="8" fill="#5A4080" opacity="0.82" />
      <circle cx="308" cy="358" r="7" fill="#6B5090" opacity="0.78" />
      <circle cx="296" cy="362" r="6" fill="#4A3878" opacity="0.72" />
      <circle cx="304" cy="344" r="7" fill="#7B60A0" opacity="0.75" />
      <circle cx="310" cy="350" r="5.5" fill="#5A4080" opacity="0.7" />
      {/* 红莓簇 */}
      <circle cx="304" cy="325" r="9" fill="#C85A48" opacity="0.8" />
      <circle cx="304" cy="325" r="3.5" fill="#FFF0EC" />
      <circle cx="294" cy="330" r="7" fill="#D06850" opacity="0.75" />
      <circle cx="294" cy="330" r="2.5" fill="#FFF0EC" />
      {/* 小红果 */}
      <circle cx="280" cy="285" r="6" fill="#D05560" opacity="0.78" />
      <circle cx="280" cy="285" r="2" fill="#FFF0F0" />
      <circle cx="288" cy="278" r="5" fill="#C04855" opacity="0.72" />
      {/* 叶 */}
      <ellipse cx="286" cy="270" rx="14" ry="9" fill="#82B29B" opacity="0.25" transform="rotate(-15, 286, 270)" />
      <ellipse cx="278" cy="310" rx="18" ry="11" fill="#7AB892" opacity="0.2" transform="rotate(10, 278, 310)" />
    </g>
  )
}

/** 右下柑橘切片 */
function CitrusCluster() {
  return (
    <g transform="translate(240, 310)">
      {/* 柑橘片 */}
      <circle cx="48" cy="48" r="20" fill="#F5C06A" opacity="0.88" stroke="#DE9960" strokeWidth="0.8" />
      <circle cx="48" cy="48" r="7" fill="#FFF5E0" />
      {/* 橘瓣分割线 */}
      <path d="M48 28 L48 68 M28 48 L68 48" stroke="#DE9960" strokeWidth="0.6" opacity="0.4" />
      <path d="M34 34 L62 62 M34 62 L62 34" stroke="#DE9960" strokeWidth="0.5" opacity="0.3" />
      {/* 小绿叶 */}
      <path d="M64 32 Q76 22 68 42" fill="#82B29B" opacity="0.6" />
      <path d="M62 28 Q70 18 66 36" fill="#8FBD9F" opacity="0.5" />
      {/* 第二片柑橘（较小） */}
      <circle cx="78" cy="38" r="12" fill="#F0B860" opacity="0.7" stroke="#DE9960" strokeWidth="0.5" />
      <circle cx="78" cy="38" r="4" fill="#FFF5E0" />
      <path d="M78 26 L78 50 M66 38 L90 38" stroke="#DE9960" strokeWidth="0.4" opacity="0.3" />
    </g>
  )
}

/** 左下鲜叶 + 小果 */
function LeafyCluster() {
  return (
    <g transform="translate(8, 310)">
      {/* 大叶 */}
      <ellipse cx="40" cy="52" rx="38" ry="22" fill="#82B29B" opacity="0.22" />
      <path d="M18 60 Q34 36 50 50 Q36 46 18 60" fill="#63AD96" opacity="0.7" />
      <path d="M44 58 Q62 38 70 54" fill="#A8D5BA" opacity="0.62" />
      <path d="M30 54 Q50 30 58 46" fill="#7FBF9F" opacity="0.55" />
      <path d="M52 56 Q72 42 78 58" fill="#90C8A8" opacity="0.5" />
      {/* 薄荷叶（锯齿边） */}
      <path d="M12 46 Q24 30 36 42 L36 48 Q24 36 12 46" fill="#7BC0A0" opacity="0.7" />
      <path d="M14 48 Q26 34 38 44 L38 50 Q26 40 14 48" fill="#6DB898" opacity="0.65" />
      {/* 小黄果 */}
      <circle cx="28" cy="44" r="10" fill="#EBC97F" opacity="0.85" />
      <circle cx="28" cy="44" r="3.5" fill="#FFF9E8" />
      <circle cx="22" cy="40" r="6" fill="#F0D080" opacity="0.72" />
      <circle cx="22" cy="40" r="2" fill="#FFF9E8" />
      {/* 小青果（青梅） */}
      <circle cx="62" cy="62" r="7" fill="#8FBF8F" opacity="0.75" />
      <circle cx="62" cy="62" r="2.5" fill="#F5FFF5" />
    </g>
  )
}

/** 通用底边花带 — 更密更大 */
function BaseFlowerRibbon() {
  return (
    <g opacity="0.78">
      {/* 左底边花簇 */}
      <circle cx="90" cy="386" r="6" fill="#E898B8" />
      <circle cx="90" cy="386" r="2" fill="#FFF5F8" />
      <circle cx="78" cy="388" r="4.5" fill="#F5C06A" opacity="0.8" />
      <circle cx="78" cy="388" r="1.5" fill="#FFF9E8" />

      {/* 中间底边花带 */}
      <circle cx="140" cy="390" r="5" fill="#8CB4E8" />
      <circle cx="140" cy="390" r="1.8" fill="#FDF8F0" />
      <circle cx="156" cy="388" r="4" fill="#EBC97F" opacity="0.85" />
      <circle cx="172" cy="391" r="5.5" fill="#C88AD0" opacity="0.82" />
      <circle cx="172" cy="391" r="2" fill="#FDF5FF" />
      <circle cx="192" cy="389" r="4.5" fill="#E898B8" opacity="0.85" />
      <circle cx="192" cy="389" r="1.8" fill="#FFF5F8" />

      {/* 右底边花簇 */}
      <circle cx="230" cy="387" r="5" fill="#F5C06A" />
      <circle cx="230" cy="387" r="1.8" fill="#FFF9E8" />
      <circle cx="250" cy="389" r="6" fill="#8CB4E8" opacity="0.85" />
      <circle cx="250" cy="389" r="2.2" fill="#FDF8F0" />
      <circle cx="266" cy="386" r="4.5" fill="#C88AD0" opacity="0.8" />
      <circle cx="266" cy="386" r="1.5" fill="#FDF5FF" />
      <circle cx="280" cy="388" r="5" fill="#E898B8" opacity="0.88" />
      <circle cx="280" cy="388" r="1.8" fill="#FFF5F8" />

      {/* 底部散落小点 — 花粉感 */}
      <circle cx="110" cy="392" r="1.5" fill="#EBC97F" opacity="0.6" />
      <circle cx="205" cy="393" r="1.5" fill="#E898B8" opacity="0.55" />
      <circle cx="240" cy="392" r="2" fill="#F5C06A" opacity="0.5" />
    </g>
  )
}

/** 三角盖内小朵点缀 — 更多 */
function FlapFlowers() {
  return (
    <g opacity="0.85">
      {/* 左盖 */}
      <circle cx="72" cy="106" r="5.5" fill="#E898B8" />
      <circle cx="72" cy="106" r="2" fill="#FFF5F8" />
      <circle cx="84" cy="96" r="4" fill="#F5C06A" opacity="0.8" />
      <circle cx="84" cy="96" r="1.5" fill="#FFF9E8" />
      <circle cx="60" cy="98" r="3.5" fill="#8CB4E8" opacity="0.75" />
      <circle cx="60" cy="98" r="1.2" fill="#FDF8F0" />

      {/* 中盖 */}
      <circle cx="180" cy="86" r="4.5" fill="#C88AD0" opacity="0.78" />
      <circle cx="180" cy="86" r="1.8" fill="#FDF5FF" />
      <circle cx="164" cy="90" r="3.5" fill="#E898B8" opacity="0.72" />
      <circle cx="196" cy="90" r="3.5" fill="#F5C06A" opacity="0.72" />

      {/* 右盖 */}
      <circle cx="288" cy="104" r="5" fill="#F5C06A" />
      <circle cx="288" cy="104" r="1.8" fill="#FFF9E8" />
      <circle cx="302" cy="94" r="4" fill="#E898B8" opacity="0.8" />
      <circle cx="302" cy="94" r="1.5" fill="#FFF5F8" />
      <circle cx="274" cy="96" r="3" fill="#8CB4E8" opacity="0.72" />
      <circle cx="274" cy="96" r="1.2" fill="#FDF8F0" />
    </g>
  )
}

function LegacyBotanical() {
  return (
    <g className="envelope-botanical-svg" aria-hidden>
      <g transform="translate(0, 168)">
        <ellipse cx="42" cy="52" rx="38" ry="22" fill="#82B29B" opacity="0.35" />
        <circle cx="28" cy="38" r="14" fill="#8CB4E8" />
        <circle cx="28" cy="38" r="5" fill="#FDF8F0" />
      </g>
    </g>
  )
}
