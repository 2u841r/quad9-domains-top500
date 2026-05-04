import { useState, useRef, useLayoutEffect } from 'react'
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
}) {
  const [hoveredRow, setHoveredRow] = useState(null)
  const [expandedCell, setExpandedCell] = useState(null) // `${rowIdx}-${key}`

  const tbodyRef = useRef(null)
  const scrollMarginRef = useRef(0)

  useLayoutEffect(() => {
    if (tbodyRef.current) {
      scrollMarginRef.current = tbodyRef.current.getBoundingClientRect().top + window.scrollY
    }
  })

  const count = rows?.length ?? 0
  const shouldVirtualize = count > 150

  const virtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? count : 0,
    estimateSize: () => 33,
    overscan: 8,
    scrollMargin: scrollMarginRef.current,
  })

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
    const bg = ri === hoveredRow ? bgHover : bgBase
    return (
      <tr
        key={ri}
        onMouseEnter={() => setHoveredRow(ri)}
        onMouseLeave={() => setHoveredRow(null)}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'var(--hover-transition)' }}
      >
        {columns.map((col, ci) => renderCell(col, ci, row, ri))}
      </tr>
    )
  }

  const virtualItems = virtualizer.getVirtualItems()
  const paddingTop = shouldVirtualize && virtualItems.length > 0
    ? virtualItems[0].start - virtualizer.options.scrollMargin
    : 0
  const paddingBottom = shouldVirtualize && virtualItems.length > 0
    ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth }}>
        <thead>
          <tr>
            {columns.map((col, ci) => (
              <th key={col.key} style={{
                ...thBase,
                textAlign: col.align ?? 'left',
                width: col.width,
                minWidth: col.width,
                maxWidth: col.width,
                ...col.style,
                ...(theadTop !== undefined ? {
                  position: 'sticky',
                  top: theadTop,
                  zIndex: col.sticky ? 4 : 3,
                } : {}),
                ...(col.sticky ? {
                  position: 'sticky',
                  left: stickyLeft[ci],
                  zIndex: theadTop !== undefined ? 4 : 2,
                  backgroundColor: 'var(--color-darker-gray)',
                } : {}),
              }}>
                {col.label}
              </th>
            ))}
          </tr>
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
