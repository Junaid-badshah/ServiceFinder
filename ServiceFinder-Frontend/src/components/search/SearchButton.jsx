function SearchButton({ label = 'Search' }) {
  return (
    <button
      type="submit"
      className="px-6 md:px-8 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-base md:text-lg shadow-md transition whitespace-nowrap flex items-center justify-center gap-2 flex-shrink-0 min-h-[56px]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.4}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      {label}
    </button>
  );
}

export default SearchButton;
