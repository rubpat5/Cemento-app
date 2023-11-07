import { useMemo, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTable, useFilters, useGlobalFilter, useAsyncDebounce, usePagination } from 'react-table'
import { matchSorter } from 'match-sorter'

import makeData from './makeData.js'

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }
    
    td {
      input {
        font-size: 1rem;
        padding: 0;
        margin: 0;
        border: 0;
        background-color: #242424;
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
    
    .pagination {
      padding: .5rem;
    }
  }
`

function GlobalFilter({
                        preGlobalFilteredRows,
                        globalFilter,
                        setGlobalFilter,
                      }) {
  const count = preGlobalFilteredRows.length
  const [value, setValue] = useState(globalFilter)
  const onChange = useAsyncDebounce(value => {
    setGlobalFilter(value || undefined)
  }, 200)

  return (
    <span>
      Search:{' '}
      <input
        value={value || ""}
        onChange={e => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${count} records...`}
        style={{
          fontSize: '1.1rem',
          border: '0',
        }}
      />
    </span>
  )
}

function DefaultColumnFilter({
                               column: { filterValue, preFilteredRows, setFilter },
                             }) {
  const count = preFilteredRows.length

  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined)
      }}
      placeholder={`Search ${count} records...`}
    />
  )
}

function SelectColumnFilter({
                              column: { filterValue, setFilter, preFilteredRows, id },
                            }) {

  const options = useMemo(() => {
    const options = new Set()
    preFilteredRows.forEach(row => {
      options.add(row.values[id])
    })
    return [...options.values()]
  }, [id, preFilteredRows])

  return (
    <select
      value={filterValue}
      onChange={e => {
        setFilter(e.target.value || undefined)
      }}
    >
      <option value="">All</option>
      {options.map((option, i) => (
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function SliderColumnFilter({
                              column: { filterValue, setFilter, preFilteredRows, id },
                            }) {

  const [min, max] = useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    preFilteredRows.forEach(row => {
      min = Math.min(row.values[id], min)
      max = Math.max(row.values[id], max)
    })
    return [min, max]
  }, [id, preFilteredRows])

  return (
    <>
      <input
        type="range"
        min={min}
        max={max}
        value={filterValue || min}
        onChange={e => {
          setFilter(parseInt(e.target.value, 10))
        }}
      />
      <button onClick={() => setFilter(undefined)}>Off</button>
    </>
  )
}
function NumberRangeColumnFilter({
                                   column: { filterValue = [], preFilteredRows, setFilter, id },
                                 }) {
  const [min, max] = useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    preFilteredRows.forEach(row => {
      min = Math.min(row.values[id], min)
      max = Math.max(row.values[id], max)
    })
    return [min, max]
  }, [id, preFilteredRows])

  return (
    <div
      style={{
        display: 'flex',
      }}
    >
      <input
        value={filterValue[0] || ''}
        type="number"
        onChange={e => {
          const val = e.target.value
          setFilter((old = []) => [val ? parseInt(val, 10) : undefined, old[1]])
        }}
        placeholder={`Min (${min})`}
        style={{
          width: '70px',
          marginRight: '0.5rem',
        }}
      />
      to
      <input
        value={filterValue[1] || ''}
        type="number"
        onChange={e => {
          const val = e.target.value
          setFilter((old = []) => [old[0], val ? parseInt(val, 10) : undefined])
        }}
        placeholder={`Max (${max})`}
        style={{
          width: '70px',
          marginLeft: '0.5rem',
        }}
      />
    </div>
  )
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

fuzzyTextFilterFn.autoRemove = val => !val

const EditableCell = ({
                        value: initialValue,
                        row: { index },
                        column: { id },
                        updateMyData,
                      }) => {
  const [value, setValue] = useState(initialValue)

  const onChange = e => {
    setValue(e.target.value)
  }

  const onBlur = () => {
    updateMyData(index, id, value)
  }

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return <input value={value} onChange={onChange} onBlur={onBlur} />
}

const defaultColumn = {
  Cell: EditableCell,
}

function Table({ columns, data, updateMyData, skipPageReset }) {
  const filterTypes = useMemo(
    () => ({
      fuzzyText: fuzzyTextFilterFn,
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
              .toLowerCase()
              .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
    }),
    []
  )

  const defaultColumn = useMemo(
    () => ({
      Filter: DefaultColumnFilter,
      Cell: EditableCell
    }),
    []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state : { pageIndex, pageSize, globalFilter, filters },
    visibleColumns,
    preGlobalFilteredRows,
    setGlobalFilter,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      filterTypes,
      updateMyData,
      autoResetPage: !skipPageReset
    },
    useFilters,
    useGlobalFilter,
    usePagination
  )


  return (
    <>
      <table {...getTableProps()}>
        <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>
                {column.render('Header')}
                {/* Render the columns filter UI */}
                <div>{column.canFilter ? column.render('Filter') : null}</div>
              </th>
            ))}
          </tr>
        ))}
        <tr>
          <th
            colSpan={visibleColumns.length}
            style={{
              textAlign: 'left',
            }}
          >
            <GlobalFilter
              preGlobalFilteredRows={preGlobalFilteredRows}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
          </th>
        </tr>
        </thead>
        <tbody {...getTableBodyProps()}>
        {page.map((row, i) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return (
                  <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                );
              })}
            </tr>
          );
        })}
        </tbody>
      </table>
      <br />
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

function filterGreaterThan(rows, id, filterValue) {
  return rows.filter(row => {
    const rowValue = row.values[id]
    return rowValue >= filterValue
  })
}

filterGreaterThan.autoRemove = val => typeof val !== 'number'

function App() {
  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        columns: [
          {
            Header: 'First Name',
            accessor: 'firstName',
          },
          {
            Header: 'Last Name',
            accessor: 'lastName',
            filter: 'fuzzyText',
          },
        ],
      },
      {
        Header: 'Info',
        columns: [
          {
            Header: 'Age',
            accessor: 'age',
            Filter: SliderColumnFilter,
            filter: 'equals',
          },
          {
            Header: 'Visits',
            accessor: 'visits',
            Filter: NumberRangeColumnFilter,
            filter: 'between',
          },
          {
            Header: 'Status',
            accessor: 'status',
            Filter: SelectColumnFilter,
            filter: 'includes',
          },
          {
            Header: 'Profile Progress',
            accessor: 'progress',
            Filter: SliderColumnFilter,
            filter: filterGreaterThan,
          },
        ],
      },
    ],
    []
  )

  const [skipPageReset, setSkipPageReset] = useState(false)
  const [data, setData] = useState(() => makeData(10000))

  useEffect(() => {
    setSkipPageReset(false)
  }, [data])

  const updateMyData = (rowIndex, columnId, value) => {
    console.log(999)
    setSkipPageReset(true)
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
          }
        }
        return row
      })
    )
  }

  return (
    <Styles>
      <Table columns={columns} data={data} updateMyData={updateMyData} skipPageReset={skipPageReset} />
    </Styles>
  )
}

export default App
