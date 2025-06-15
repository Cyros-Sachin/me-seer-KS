import { useState, useEffect } from "react";
import Cookies from "js-cookie";
const units = [
  "kg", "ml", "gm", "unit", "slices", "cubes", "packets", "cup", "pinch",
  "clove", "ounces", "small sized", "medium sized", "large sized", "teaspoon"
];

export const FoodItemForm = ({ userId, cat_qty_id1, cat_qty_id2, collective_id, onClose }) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const userInfo = Cookies.get("userInfo");
  if (!userInfo) throw new Error('User not authenticated');

  const { access_token } = JSON.parse(userInfo);
  // Fetch suggestions
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://meseer.com/dog/food-items/search/${search}`, {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });

        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error("Failed to fetch food suggestions", err);
        setSuggestions([]);
      }
    }, 300);

  }, [search]);

  const handleSubmit = async () => {
    if (!selectedFood || !quantity || !unit) return;

    const selectedUnitId = unitMap[unit]; // use correct ID below
    const now = new Date().toISOString().slice(0, 19);

    const payload = {
      a_id: 9,
      at_id: 1,
      flag: "PN",
      trigger: "food_item",
      is_active: true,
      user_id: userId,
      description: selectedFood.name,
      event_time: now,
      cat_qty_id1,
      cat_qty_id2,
      cat_qty_id3: selectedUnitId,
      cat_qty_id4: 0,
      cat_qty_id5: 0,
      cat_qty_id6: 0,
      value1: "",
      value2: selectedFood.name,
      value3: quantity,
      value4: "",
      value5: "",
      value6: "",
      cat_qty_undefined: 0,
      valueundefined: ""
    };

    setLoading(true);
    try {
      const res = await fetch("https://meseer.com/dog/user_activity_insert", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to submit");
      onClose(); // or refresh food items
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const unitMap = {
    kg: 24, ml: 25, gm: 26, unit: 27, slices: 28, cubes: 29, packets: 30,
    cup: 31, pinch: 32, clove: 33, ounces: 34, "small sized": 35,
    "medium sized": 36, "large sized": 37, teaspoon: 38
  };

  const isValid = !!selectedFood && !!quantity && !!unit;

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-xl mx-auto">
      <h3 className="text-xl font-semibold mb-4">Add Food Item</h3>

      {/* Search Field */}
      <div className="mb-3">
        <label className="text-sm font-medium text-gray-600">Search Food</label>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedFood(null); // reset selection
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Start typing..."
        />
        {suggestions.length > 0 && (
          <ul className="bg-white border border-gray-200 mt-1 max-h-40 overflow-y-auto rounded shadow">
            {suggestions.map((s, idx) => (
              <li
                key={idx}
                onClick={() => {
                  setSelectedFood(s);
                  setSearch(s.name);
                  setSuggestions([]);
                }}
                className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quantity */}
      <div className="mb-3">
        <label className="text-sm font-medium text-gray-600">Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Unit */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-600">Unit</label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Select unit</option>
          {units.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 text-sm"
        >
          Cancel
        </button>
        <button
          disabled={!isValid || loading}
          onClick={handleSubmit}
          className={`px-4 py-2 rounded text-sm text-white ${isValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
};
