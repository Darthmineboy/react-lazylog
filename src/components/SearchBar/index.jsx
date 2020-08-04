import { Component } from 'react';
import { bool, func, number } from 'prop-types';
import FilterLinesIcon from './FilterLinesIcon';
import { SEARCH_MIN_KEYWORDS } from '../../utils';
import {
  searchBar,
  searchInput,
  button,
  active,
  inactive,
} from './index.module.css';

export default class SearchBar extends Component {
  static propTypes = {
    /**
     * Executes a function when the user starts typing.
     */
    onSearch: func,
    /**
     * Executes a function when the search input has been cleared.
     */
    onClearSearch: func,
    /**
     * Executes a function when the option `Filter Lines With Matches`
     * is enable.
     */
    onFilterLinesWithMatches: func,
    /**
     * Number of search results. Should come from the component
     * executing the search algorithm.
     */
    resultsCount: number,
    /**
     * If true, then only lines that match the search term will be displayed.
     */
    filterActive: bool,
    /**
     * If true, the input field and filter button will be disabled.
     */
    disabled: bool,
    /**
     * Indicates whether a search is currently taking place.
     */
    loading: bool,
  };

  static defaultProps = {
    onSearch: () => {},
    onClearSearch: () => {},
    onFilterLinesWithMatches: () => {},
    resultsCount: 0,
    filterActive: false,
    disabled: false,
  };

  state = {
    keywords: '',
  };

  handleFilterToggle = () => {
    this.props.onFilterLinesWithMatches(!this.props.filterActive);
  };

  handleSearchChange = e => {
    const { value: keywords } = e.target;

    this.setState({ keywords }, () => this.search());
  };

  handleSearchKeyPress = e => {
    if (e.key === 'Enter') {
      this.handleFilterToggle();
    }
  };

  search = () => {
    const { keywords } = this.state;
    const { onSearch, onClearSearch } = this.props;

    if (keywords && keywords.length > SEARCH_MIN_KEYWORDS) {
      onSearch(keywords);
    } else {
      onClearSearch();
    }
  };

  render() {
    const { resultsCount, filterActive, disabled, loading } = this.props;
    const matchesLabel = `match${resultsCount === 1 ? '' : 'es'}`;
    const filterIcon = filterActive ? active : inactive;

    return (
      <div className={`react-lazylog-searchbar ${searchBar}`}>
        <span style={{ position: 'relative' }}>
          <input
            autoComplete="off"
            type="text"
            name="search"
            placeholder="Search"
            className={`react-lazylog-searchbar-input ${searchInput}`}
            onChange={this.handleSearchChange}
            onKeyPress={this.handleSearchKeyPress}
            value={this.state.keywords}
            disabled={disabled}
          />
          {loading && this.renderLoader()}
        </span>
        <button
          disabled={disabled}
          className={`react-lazylog-searchbar-filter ${
            filterActive ? 'active' : 'inactive'
          } ${button} ${filterIcon}`}
          onClick={this.handleFilterToggle}>
          <FilterLinesIcon />
        </button>
        <span
          className={`react-lazylog-searchbar-matches ${
            resultsCount ? 'active' : 'inactive'
          } ${resultsCount ? active : inactive}`}>
          {resultsCount} {matchesLabel}
        </span>
      </div>
    );
  }

  renderLoader() {
    const size = 20;

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 38 38"
        xmlns="http://www.w3.org/2000/svg"
        stroke="#fff"
        style={{
          position: 'absolute',
          right: '13px',
          top: '50%',
          marginTop: `-${20 / 2}px`,
        }}>
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)" strokeWidth="2">
            <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
            <path d="M36 18c0-9.94-8.06-18-18-18">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </g>
      </svg>
    );
  }
}
