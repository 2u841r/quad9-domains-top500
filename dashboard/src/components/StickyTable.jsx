import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'

const thBase = {
  padding: 'var(--space-xxs) var(--space-sm)',
  color: 'var(--color-lighter-gray)',
  fontSize: 'var(--font-size-md)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 'var(--font-weight)',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-darkest-gray)',
  whiteSpace: 'nowrap',
  backgroundColor: 'var(--color-darker-gray)',
}

const tdBase = {
  padding: 'var(--space-xxs) var(--space-sm)',
  fontSize: 'var(--font-size-lg)',
  borderBottom: '1px solid var(--color-darker-gray)',
  whiteSpace: 'nowrap',
}

/**
 * columns: Array of {
 *   key: string,
 *   label: string,
 *   sticky?: boolean,       // stick to left while scrolling
 *   width?: number,         // px — required for sticky cols before the last one
 *   maxWidth?: string,      // css value, clips content, e.g. '33vw'
 *   expandable?: boolean,   // tap to reveal full content when truncated
 *   href?: (value, row) => string,  // open on second tap when expandable
 *   align?: 'left'|'right'|'center',
 *   render?: (value, row) => ReactNode,
 *   style?: object,         // extra td/th styles
 * }
 */
export default function StickyTable({
  columns,
  rows,
  onRowClick,
  bgBase = 'var(--color-dark-gray)',
  bgHover = 'var(--color-darker-gray)',
  minWidth,
  theadTop,
  fullWidth,
  tableWidth,
}) {
  const [hoveredRow, setHoveredRow] = useState(null)
  const [expandedCell, setExpandedCell] = useState(null)
  const [bodyTableWidth, setBodyTableWidth] = useState(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const [rowHeight, setRowHeight] = useState(33)
  const count = rows?.length ?? 0

  const tbodyRef = useRef(null)
  const bodyTableRef = useRef(null)
  const bodyScrollRef = useRef(null)
  const stickyHeadRef = useRef(null)

  useLayoutEffect(() => {
    // Measure the scroll wrapper, not the tbody: the tbody sits inside the
    // absolutely offset table, so its document position moves with the
    // virtual window. The wrapper's top is scroll-independent.
    const el = bodyScrollRef.current ?? tbodyRef.current
    if (!el) return

    function measure() {
      const next = Math.round(el.getBoundingClientRect().top + window.scrollY)
      setScrollMargin(prev => prev === next ? prev : next)
    }

    measure()
    // RAF catches layout that settles asynchronously after data loads
    const raf = requestAnimationFrame(measure)

    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [count, theadTop, minWidth, tableWidth, fullWidth])

  // Measure the real rendered row height so the virtualizer's estimate matches
  // the DOM. Without this, getTotalSize() drifts from the actual content height
  // and the native scrollbar thumb desyncs while being dragged.
  useLayoutEffect(() => {
    const tr = tbodyRef.current?.querySelector('tr[data-row]')
    if (!tr) return
    // Keep the fractional height: rounding a 33.5px row to 33 accumulates
    // hundreds of px of drift across 500 rows.
    const h = tr.getBoundingClientRect().height
    if (h > 0 && Math.abs(h - rowHeight) > 0.25) setRowHeight(h)
  }, [count, rowHeight])

  const shouldVirtualize = count > 150

  const virtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? count : 0,
    estimateSize: () => rowHeight,
    overscan: 8,
    scrollMargin,
  })

  // estimateSize is not part of the virtualizer's measurement-memo deps, so an
  // estimate change requires explicit cache invalidation for getTotalSize() and
  // item positions to reflect the new value.
  useEffect(() => {
    virtualizer.measure()
  }, [rowHeight, scrollMargin, virtualizer])

  // Compute cumulative left offsets for sticky columns
  const stickyLeft = []
  let cumLeft = 0
  let lastStickyIdx = -1
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].sticky) {
      stickyLeft.push(cumLeft)
      cumLeft += columns[i].width ?? 0
      lastStickyIdx = i
    } else {
      stickyLeft.push(null)
    }
  }

  // Keep sticky header table width in sync with body table (body may be wider than viewport)
  useLayoutEffect(() => {
    if (theadTop === undefined || !bodyTableRef.current) return
    const ro = new ResizeObserver(() => {
      const w = bodyTableRef.current?.offsetWidth
      if (w) setBodyTableWidth(prev => prev === w ? prev : w)
    })
    ro.observe(bodyTableRef.current)
    setBodyTableWidth(bodyTableRef.current.offsetWidth)
    return () => ro.disconnect()
  }, [theadTop, columns.length])

  function onBodyScroll() {
    if (stickyHeadRef.current && bodyScrollRef.current) {
      stickyHeadRef.current.scrollLeft = bodyScrollRef.current.scrollLeft
    }
  }

  // Shared colgroup — same col widths in both header and body tables
  // colWidth: CSS value for sizing (e.g. '40%', 200); width: px used for sticky left offsets
  const colgroup = (
    <colgroup>
      {columns.map(col => {
        const w = col.colWidth ?? col.width
        return <col key={col.key} style={w ? { width: w } : undefined} />
      })}
    </colgroup>
  )

  function renderTh(col, ci) {
    return (
      <th key={col.key} style={{
        ...thBase,
        textAlign: col.align ?? 'left',
        ...col.style,
        ...(col.sticky ? {
          position: 'sticky',
          left: stickyLeft[ci],
          zIndex: 2,
          backgroundColor: 'var(--color-darker-gray)',
        } : {}),
      }}>
        {col.label}
      </th>
    )
  }

  function renderCell(col, ci, row, ri) {
    const cellKey = `${ri}-${col.key}`
    const isExpanded = expandedCell === cellKey
    const value = row[col.key]
    const content = col.render ? col.render(value, row) : value
    const bg = ri === hoveredRow ? bgHover : bgBase

    return (
      <td
        key={col.key}
        title={col.expandable ? String(value ?? '') : undefined}
        onClick={col.expandable
          ? e => {
              e.stopPropagation()
              if (isExpanded) {
                if (col.href) window.open(col.href(value, row), '_blank', 'noopener,noreferrer')
                setExpandedCell(null)
              } else {
                const truncated = e.currentTarget.scrollWidth > e.currentTarget.offsetWidth
                if (truncated) {
                  setExpandedCell(cellKey)
                } else if (col.href) {
                  window.open(col.href(value, row), '_blank', 'noopener,noreferrer')
                }
              }
            }
          : undefined}
        style={{
          ...tdBase,
          textAlign: col.align ?? 'left',
          ...col.style,
          ...(col.sticky ? {
            position: 'sticky',
            left: stickyLeft[ci],
            zIndex: 1,
            backgroundColor: bg,
            transition: 'var(--hover-transition)',
            ...(ci === lastStickyIdx ? { boxShadow: `-4px 0 0 4px ${bg}` } : {}),
          } : {}),
          ...(col.maxWidth ? {
            maxWidth: col.maxWidth,
            overflow: 'hidden',
            paddingRight: 0,
            textOverflow: isExpanded ? 'clip' : 'ellipsis',
            whiteSpace: isExpanded ? 'normal' : 'nowrap',
            wordBreak: isExpanded ? 'break-all' : 'normal',
            cursor: col.expandable ? 'pointer' : undefined,
          } : {}),
        }}
      >
        {content}
      </td>
    )
  }

  function renderRow(row, ri) {
    return (
      <tr
        key={ri}
        data-row=""
        onMouseEnter={() => setHoveredRow(ri)}
        onMouseLeave={() => setHoveredRow(null)}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'var(--hover-transition)', backgroundColor: ri === hoveredRow ? bgHover : bgBase }}
      >
        {columns.map((col, ci) => renderCell(col, ci, row, ri))}
      </tr>
    )
  }

  const virtualItems = virtualizer.getVirtualItems()

  // Document height must be a pure function of count * rowHeight, never of
  // which rows happen to be mounted. A spacer div fixed at getTotalSize()
  // guarantees that; the table is absolutely offset inside it. Padding rows
  // cannot do this: they add (real - estimated) height per mounted row, so
  // the document height jitters while the native scrollbar is dragged.
  const totalSize = shouldVirtualize ? virtualizer.getTotalSize() : 0
  const offsetY = shouldVirtualize && virtualItems.length > 0
    ? virtualItems[0].start - virtualizer.options.scrollMargin
    : 0
  const paddingTop = offsetY
  const paddingBottom = shouldVirtualize && virtualItems.length > 0
    ? totalSize - (virtualItems[virtualItems.length - 1].end - virtualizer.options.scrollMargin)
    : 0

  const tableStyle = { ...(tableWidth ? { width: tableWidth } : fullWidth ? { width: '100%' } : {}), borderCollapse: 'collapse', tableLayout: 'fixed', minWidth }
  // The spacer carries the table's horizontal sizing so overflow-x scrolling
  // still gets the full width (an absolutely positioned table does not
  // contribute to its parent's scrollable width).
  const spacerStyle = {
    ...(tableWidth ? { width: tableWidth } : fullWidth ? { width: '100%' } : {}),
    minWidth,
    height: totalSize,
    position: 'relative',
  }

  if (theadTop !== undefined) {
    return (
      <div style={{ overflowAnchor: 'none' }}>
        {/* Sticky header — outside overflow-x:auto, position:sticky works */}
        <div
          ref={stickyHeadRef}
          style={{ position: 'sticky', top: theadTop, zIndex: 3, overflowX: 'hidden', ...(fullWidth ? { width: bodyTableWidth ?? '100%' } : {}) }}
        >
          <table style={{ ...tableStyle, ...(fullWidth ? { width: '100%' } : {}) }}>
            {colgroup}
            <thead>
              <tr>{columns.map((col, ci) => renderTh(col, ci))}</tr>
            </thead>
          </table>
        </div>
        {/* Scrollable body. overflow-y hidden so sub-pixel overshoot of the
            offset table past the spacer cannot spawn a nested scrollbar. */}
        <div ref={bodyScrollRef} style={{ overflowX: 'auto', overflowY: 'hidden' }} onScroll={onBodyScroll}>
          {shouldVirtualize ? (
            <div style={spacerStyle}>
              <table
                ref={bodyTableRef}
                style={{ ...tableStyle, position: 'absolute', top: offsetY, left: 0 }}
              >
                {colgroup}
                <tbody ref={tbodyRef}>
                  {virtualItems.map(vr => renderRow(rows[vr.index], vr.index))}
                </tbody>
              </table>
            </div>
          ) : (
            <table ref={bodyTableRef} style={tableStyle}>
              {colgroup}
              <tbody ref={tbodyRef}>
                {rows?.map((row, ri) => renderRow(row, ri))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', overflowAnchor: 'none' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth }}>
        <thead>
          <tr>{columns.map((col, ci) => renderTh(col, ci))}</tr>
        </thead>
        <tbody ref={tbodyRef}>
          {paddingTop > 0 && <tr><td style={{ height: paddingTop }} /></tr>}
          {shouldVirtualize
            ? virtualItems.map(vr => renderRow(rows[vr.index], vr.index))
            : rows?.map((row, ri) => renderRow(row, ri))
          }
          {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} /></tr>}
        </tbody>
      </table>
    </div>
  )
}
