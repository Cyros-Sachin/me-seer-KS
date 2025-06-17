"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const DynamicActivityItemForm = ({
  a_id,
  at_id,
  trigger,
  userId,
  collectiveId,
  isOpen,
  onClose,
  onSuccess,
}: {
  a_id: number;
  at_id: number;
  trigger: string;
  userId: string;
  collectiveId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) => {
  const [template, setTemplate] = useState<any>({});
  const [values, setValues] = useState<Record<number, string>>({});
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [selectedSearchItem, setSelectedSearchItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = JSON.parse(Cookies.get("userInfo") || "{}").access_token;

  useEffect(() => {
    if (!isOpen || !a_id) return;
    fetchTemplateData();
  }, [a_id, isOpen]);

  const fetchTemplateData = async () => {
    try {
      const res = await fetch(`https://meseer.com/dog/generic/templates/${a_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTemplate(data);
      setValues({});
      setQuantities({});
    } catch (err) {
      console.error("Template fetch failed", err);
    }
  };

  useEffect(() => {
    if (!search) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const isFood = trigger.toLowerCase().includes("food") || trigger.toLowerCase().includes("meal");
        const url = isFood
          ? `https://meseer.com/dog/food-items/search/${search}`
          : `https://meseer.com/dog/exercise/search/${search}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setSuggestions(json);
      } catch (e) {
        console.error("Search fetch failed", e);
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, trigger]);

  const handleChange = (index: number, value: string) => {
    setValues((prev) => ({ ...prev, [index]: value }));
  };

  const handleQuantityChange = (index: number, value: string) => {
    setQuantities((prev) => ({ ...prev, [index]: value }));
  };

  const renderField = (idKey: string, index: number) => {
    const items = template[idKey];
    if (!items || items.length === 0 || items[0].item_name?.toLowerCase().includes("doesn't exist") || items[0].item_name?.toLowerCase() === "none")
      return null;

    const label = items[0].item_description || items[0].item_name || `Field ${index}`;

    if (items[0]?.item_type?.includes("unit") || items.length > 1) {
      const label = items[0].item_description || items[0].item_name || `Field ${index}`;
      const showQuantityInput = items.some((x: any) => x.item_type?.includes("unit"));

      return (
        <div key={idKey} className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
          <div className="flex gap-3">
            {showQuantityInput && (
              <input
                type="number"
                placeholder="Quantity"
                className="flex-1 border rounded px-3 py-2"
                value={quantities[index] || ""}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
              />
            )}
            <select
              className={`${showQuantityInput ? "flex-1" : "w-full"} border rounded px-3 py-2`}
              value={values[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
            >
              <option value="">Select...</option>
              {items
                .filter((x: any) => x.unit_id || x.name)
                .map((opt: any, i: number) => (
                  <option key={i} value={opt.unit_id || opt.name}>
                    {opt.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      );
    }

    if (items[0].item_type?.includes("Search")) {
      return (
        <div key={idKey} className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedSearchItem(null);
            }}
            placeholder="Search..."
            className="w-full border px-3 py-2 rounded"
          />
          {suggestions.length > 0 && (
            <ul className="border bg-white max-h-40 overflow-y-auto shadow rounded mt-1 text-sm">
              {suggestions.map((s: any, i: number) => (
                <li
                  key={i}
                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    setSelectedSearchItem(s);
                    setSearch(s.name);
                    setSuggestions([]);
                    handleChange(index, s.name);
                  }}
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    return (
      <div key={idKey} className="mb-3">
        <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={values[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
        />
      </div>
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const event_time = new Date().toISOString().slice(0, 19);

      const payload: any = {
        a_id,
        at_id,
        flag: "PN",
        trigger,
        is_active: true,
        user_id: userId,
        event_time,
        description: selectedSearchItem?.name || trigger,
        cat_qty_id1: collectiveId,
        cat_qty_id2: 348,
        cat_qty_id3: 0,
        cat_qty_id4: 0,
        cat_qty_id5: 0,
        cat_qty_id6: 0,
        value1: "",
        value2: "",
        value3: "",
        value4: "",
        value5: "",
        value6: "",
        cat_qty_undefined: 0,
        valueundefined: "",
      };

      for (let i = 1; i <= 6; i++) {
        const itemList = template[`item_id${i}`];

        if (!itemList || itemList.length === 0 || itemList[0].item_name?.toLowerCase().includes("doesn't exist")) {
          continue;
        }

        const isUnitType = itemList[0]?.item_type?.includes("unit") || itemList.length > 1;

        if (isUnitType) {
          // Store quantity in value[i]
          payload[`value${i}`] = quantities[i] || "";
          // Store unit_id in cat_qty_id[i]
          payload[`cat_qty_id${i}`] = Number(values[i]) || 0;
        } else if (itemList[0].item_type?.includes("Search")) {
          // Search item (e.g., food or exercise) in value[i]
          payload[`value${i}`] = values[i] || "";
        } else {
          // Generic text input
          payload[`value${i}`] = values[i] || "";
        }
      }

      await fetch("https://meseer.com/dog/user_activity_insert", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      onClose();
      onSuccess?.();
    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-5000 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg space-y-4">
        <h2 className="text-xl font-semibold capitalize">{trigger}</h2>

        {["item_id1", "item_id2", "item_id3", "item_id4", "item_id5", "item_id6"].map((key, i) =>
          renderField(key, i + 1)
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="bg-gray-200 px-4 py-2 rounded text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 px-4 py-2 rounded text-sm text-white hover:bg-blue-700"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicActivityItemForm;