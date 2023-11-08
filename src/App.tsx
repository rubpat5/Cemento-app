import { useMemo, useState, useEffect } from 'react'
import styled from 'styled-components'
import { Table } from "./Components/Table.tsx"
import { NumberRangeColumnFilter, SelectColumnFilter, SliderColumnFilter } from "./Components/Filters.tsx";

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
