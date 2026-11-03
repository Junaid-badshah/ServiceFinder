import { useEffect, useState } from 'react';
import ServiceSelect from './ServiceSelect';
import LocationInput from './LocationInput';
import SearchButton from './SearchButton';

function SearchBar({
  initialService = '',
  initialLocation = '',
  onSearch,
  variant = 'default',
}) {
  const [searchService, setSearchService] = useState(initialService);
  const [searchLocation, setSearchLocation] = useState(initialLocation);

  useEffect(() => {
    setSearchService(initialService);
    setSearchLocation(initialLocation);
  }, [initialService, initialLocation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch({ service: searchService, location: searchLocation });
  };

  const wrapperClass =
    variant === 'gradient'
      ? 'bg-gradient-to-r from-primary-600 to-purple-600 shadow-lg'
      : '';

  const innerClass =
    variant === 'gradient'
      ? 'max-w-5xl mx-auto px-4 py-5'
      : 'w-full max-w-5xl mx-auto';

  return (
    <div className={wrapperClass}>
      <div className={innerClass}>
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 flex flex-col md:flex-row gap-2"
        >
          <ServiceSelect value={searchService} onChange={setSearchService} />
          <LocationInput value={searchLocation} onChange={setSearchLocation} />
          <SearchButton />
        </form>
      </div>
    </div>
  );
}

export default SearchBar;
