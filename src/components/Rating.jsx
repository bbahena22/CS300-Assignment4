import { useState } from "react";

function Rating({ totalStars = 5, rating, onRate }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="rating">
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        const active = starValue <= (hover || rating);

        return (
          <span
            key={i}
            className={`star ${active ? "filled" : "empty"}`}
            onClick={() => onRate(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
          >
            {active ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
}

export default Rating;