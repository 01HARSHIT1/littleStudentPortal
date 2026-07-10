import { Inbox } from 'lucide-react'

export default function DataTable({ columns, rows, empty = 'No records found', keyField = '_id' }) {
  if (!rows?.length) {
    return (
      <div className="empty-state panel">
        <Inbox size={40} />
        <h3>{empty}</h3>
        <p className="text-sm">Try adjusting filters or add a new record.</p>
      </div>
    )
  }

  return (
    <div className="table-wrap animate-fade">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key || col.header}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row[keyField] || idx}>
              {columns.map((col) => (
                <td key={col.key || col.header}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
