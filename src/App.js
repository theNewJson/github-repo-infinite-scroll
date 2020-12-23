import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import useFetch from 'use-http';
import _ from 'lodash'
import './App.css';

const actionType = {
  UpdateSearchText: 'Update_Search_Text',
  StartFetchingRepo: 'Start_Fetching_Repo',
  UpdateSearchResult: 'Update_Search_Result',
  FetchingFail: 'Fetching_Fail',
  FetchingMore: 'Fetching_More',
  AppendSearchResult: 'Append_Search_Result'
}

const initialState = {
  searchText: '',
  searchResult: [],
  page: 1,
  loading: false,
  isError: false,
  errorMessage: '',
  isFetchingMore: false,
  scrollable: true
}

const reducer = (state, action) => {
  switch (action.type) {
    case actionType.UpdateSearchText:
      return { ...state, searchText: action.payload };
    case actionType.StartFetchingRepo:
      return { ...state, loading: true };
    case actionType.UpdateSearchResult:
      return { ...state, searchResult: action.payload, loading: false };
    case actionType.FetchingFail:
      return { ...state, loading: false, isError: true, errorMessage: action.payload };
    case actionType.FetchingMore:
      return { ...state, isFetchingMore: true, scrollable: false };
    case actionType.AppendSearchResult:
      console.log('action', action)
      return { ...state, searchResult: [...state.searchResult, ...action.payload], isFetchingMore: false, scrollable: true, page: state.page + 1 };
    default:
      throw new Error();
  }
}

function App() {

  const [state, dispatch] = useReducer(reducer, initialState)
  const { get } = useFetch('https://api.github.com')
  const fetchRepos = useCallback(_.debounce((searchText) => {
    console.log('fetch')
    get(`/search/repositories?q=${searchText}&per_page=10&page=${state.page}`).then((value) => {
      console.log('value', value)
      dispatch({ type: actionType.UpdateSearchResult, payload: value.items})
    }, (error) => {
      dispatch({ type: actionType.FetchingFail, payload: error})
    })
  }, 500, { trailing: true }), [])

  const fetchMore = (page) => {
    console.log('fetch more')
    get(`/search/repositories?q=${state.searchText}&per_page=10&page=${page}`).then((value) => {
      console.log('value', value)
      dispatch({ type: actionType.AppendSearchResult, payload: value.items })
    }, (error) => {
      console.log('error', error)
      dispatch({ type: actionType.FetchingFail, payload: error})
    })
  }
  useEffect(() => {
    if (state.searchText) {
      dispatch({ type: actionType.StartFetchingRepo })
      fetchRepos(state.searchText)
    }
  }, [state.searchText])

  const handleInputChange = (e) => {
    dispatch({ type: actionType.UpdateSearchText, payload: e.target.value })
  }
  const handleScroll = (e) => {
    if (e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight) {
      dispatch({ type: actionType.FetchingMore })
      fetchMore(state.page + 1)
    }
  }
  return (
    <div className="App">
      <header className="App-header">
        <input onChange={handleInputChange}/>
        <div>
          {state.isError && <div>
            <div>Something Wrong!</div>
            <span css={{ color: 'red' }}>{state.errorMessage}</span>
            </div>}
          {state.loading ? <div>loading...</div> :
            state.searchResult.length === 0 ?
            <div>type keyword to search for repos...</div> : 
            <div onScroll={handleScroll} className='scroll' style={{ overflow: state.scrollable ? 'scroll' : 'hidden'}}>
              {state.searchResult?.map(repo => <div key={repo.id}>{repo.full_name}</div>)}
              {state.searchResult.length !== 0 && state.isFetchingMore ? <div style={{ height: '50px', paddingTop: '10px', paddingBottom: '10px'}}>fetching more...</div>: <div style={{ height: '50px', paddingTop: '10px', paddingBottom: '10px'}}>scroll down to fetch more...</div>}
            </div>}
        </div>
      </header>
    </div>
  );
}

export default App;
