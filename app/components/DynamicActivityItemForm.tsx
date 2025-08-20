"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const DynamicActivityItemForm = ({
  a_id,
  at_id,
  trigger,
  userId,
  collectiveId,
  isOpen,
  onClose,
  onSuccess,
  selectedTaskDetails,
  selectedGoalDetails
}: {
  a_id: number;
  at_id: number;
  trigger: string;
  userId: string;
  collectiveId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedGoalDetails?: {
    goalId: number;
    goalName: string;
    tasks: any[];
  };
  selectedTaskDetails?: { task_id: number; task_name: string; collective_id: number }; // ✅ optional type
}) => {
  const [template, setTemplate] = useState<any>({});
  const [values, setValues] = useState<Record<number, string>>({});
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [selectedSearchItem, setSelectedSearchItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = JSON.parse(Cookies.get("userInfo") || "{}").access_token;
  const [subspaces, setSubspaces] = useState<{ subspace_id: number; name: string }[]>([]);
  const [selectedSubspace, setSelectedSubspace] = useState<{ subspace_id: number; name: string } | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [renderedIndexes, setRenderedIndexes] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen || !a_id) return;
    fetchTemplateData();
  }, [a_id, isOpen]);

  useEffect(() => {
    const fetchSubspaces = async () => {
      try {
        const res = await fetch(`https://meseer.com/dog/space-subspace/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // Transform into flat array with proper labels
        const transformed = Object.entries(data).flatMap(([spaceKey, subspaceArrRaw]) => {
          const subspaceArr = subspaceArrRaw as Record<string, number>[];
          const spaceLabel = spaceKey.split(",")[1]?.replace("]", "").trim(); // e.g. "Work"

          return subspaceArr.map((sub) => {
            const label = Object.keys(sub)[0];
            const id = Object.values(sub)[0];
            return {
              subspace_id: id,
              name: `${spaceLabel} - ${label}`,
            };
          });
        });

        setSubspaces(transformed);
      } catch (err) {
        console.error("Failed to fetch subspaces", err);
      }
    };

    fetchSubspaces();
  }, [userId]);


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
    if (
      !items ||
      items.length === 0 ||
      items[0].item_name?.toLowerCase().includes("doesn't exist") ||
      items[0].item_name?.toLowerCase() === "none"
    )
      return null;

    const itemMeta = items[0];
    const itemId = Number(itemMeta.item_id);
    const isWhatOverride = itemId === 47 || itemId === 48 || itemId === 49; // show plain text input (for "What")
    const namefield = itemId === 38;
    const label = (isWhatOverride ? itemMeta.item_name : itemMeta.item_description || itemMeta.item_name || `Field ${index}`)
      .replace(/^add\s+/i, "")
      .replace(/\bbased on.*$/i, "")
      .trim();
    if (
      label.toLowerCase().includes("meal_id") ||
      label.toLowerCase().includes("workout_id") ||
      label.toLowerCase().includes("etc")
    ) {
      return null;
    }
    const isUnit = itemMeta.item_type?.toLowerCase()?.includes("unit");
    const isSearch = itemMeta.item_type?.toLowerCase()?.includes("search");
    const isCategory = itemMeta.item_type?.toLowerCase()?.includes("category");
    // Inside renderField
    const isSubspace = itemMeta.item_name?.toLowerCase().includes("subspace");
    if (!renderedIndexes.includes(index)) {
      setRenderedIndexes((prev) => [...prev, index]);
    }
    if (isSubspace) {
      // only once per render

      return (
        <div key={idKey} className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Select Subspace</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedSubspace?.subspace_id || ""}
            onChange={(e) => {
              const sub = subspaces.find(s => s.subspace_id === Number(e.target.value));
              if (sub) setSelectedSubspace(sub);
            }}
          >
            <option value="">Select...</option>
            {subspaces.map((s) => (
              <option key={s.subspace_id} value={s.subspace_id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      );
    }
    // 🔍 Render Search Field
    if (isSearch) {
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

    // ⏱ Render Unit Field (e.g. Time, show quantity + unit)
    if (isUnit) {
      const unitOptions = items.filter((x: any) => x.unit_id || x.name);
      const singleUnit = unitOptions.length === 1;
      const isDateField = unitOptions.some((u: any) =>
        /date|mm\/dd\/yyyy|dd\/mm\/yyyy/i.test(u.name || u.description)
      );
      const isDateTimeField = unitOptions.some((u: any) =>
        /hh:mm|date time|datetime/i.test(u.name || u.description || "")
      );
      const isTimeField = unitOptions.some((u: any) =>
        /^hh:mm$/i.test(u.name || u.description || "")
      );


      return (
        <div key={idKey} className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
          <div className="flex gap-3 items-center">
            {isTimeField ? (
              <input
                type="time"
                className="flex-1 border rounded px-3 py-2"
                value={values[index] || ""}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            ) : isDateTimeField ? (
              <input
                type="datetime-local"
                className="flex-1 border rounded px-3 py-2"
                value={values[index] || ""}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            ) : isDateField ? (
              <input
                type="date"
                className="flex-1 border rounded px-3 py-2"
                value={values[index] || ""}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            ) : isWhatOverride ? (
              <textarea
                placeholder="text"
                className="flex-1 border rounded px-3 py-2"
                value={values[index] || ""}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            ) : namefield ? (
              <input
                placeholder="text"
                className="flex-1 border rounded px-3 py-2"
                value={values[index] || ""}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            ) : (
              <input
                type="number"
                placeholder="Quantity"
                className="flex-1 border rounded px-3 py-2"
                value={quantities[index] || ""}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
              />
            )}

            {!isDateField && (singleUnit ? (
              <span className="text-gray-700">{unitOptions[0].name}</span>
            ) : (
              <select
                className="flex-1 border rounded px-3 py-2"
                value={values[index] || ""}
                onChange={(e) => handleChange(index, e.target.value)}
              >
                <option value="">Select...</option>
                {unitOptions.map((opt: any, i: number) => (
                  <option key={i} value={opt.unit_id || opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      );
    }

    // 🍽️ Render Category Dropdown (like Days, Meal Type, etc.)
    if (isCategory || items.length > 1) {
      return (
        <div key={idKey} className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={values[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
          >
            <option value="">Select...</option>
            {items
              .filter((x: any) => x.cat_id || x.name)
              .map((opt: any, i: number) => (
                <option key={i} value={opt.cat_id || opt.name}>
                  {opt.name}
                </option>
              ))}
          </select>
        </div>
      );
    }

    // ✏️ Default text input fallback
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
    const invalidFields: string[] = [];

    // Create a map of rendered fields and their metadata
    const renderedFields = renderedIndexes.map(index => {
      const itemList = template[`item_id${index}`];
      if (!itemList || itemList.length === 0) return null;

      const meta = itemList[0];
      return {
        index,
        label: meta.item_description || meta.item_name || `Field ${index}`,
        type: meta.item_type?.toLowerCase() || "",
        isRequired: !meta.item_name?.toLowerCase().includes("optional"),
        isUnit: meta.item_type?.toLowerCase()?.includes("unit"),
        isSearch: meta.item_type?.toLowerCase()?.includes("search"),
        isCategory: meta.item_type?.toLowerCase()?.includes("category"),
        isSubspace: meta.item_name?.toLowerCase().includes("subspace"),
        isDate: meta.item_name?.toLowerCase().includes("date"),
        isTime: meta.item_name?.toLowerCase().includes("time"),
        unitOptions: itemList.filter((x: any) => x.unit_id)
      };
    }).filter(Boolean);

    // Validate each rendered field
    renderedFields.forEach((field) => {
      if (!field) return;
      const { index, label, type, isRequired, isUnit, isSearch, isCategory, isSubspace, unitOptions } = field;
      const value = values[index];
      const quantity = quantities[index];

      // Skip validation for optional fields
      if (!isRequired) return;

      // Special case for subspace
      if (isSubspace) {
        if (!selectedSubspace || !selectedSubspace.subspace_id) {
          invalidFields.push("Subspace");
          return;
        }
      }

      // Handle unit fields
      if (isUnit) {
        const isDateField = unitOptions.some((u: any) =>
          /date|mm\/dd\/yyyy|dd\/mm\/yyyy/i.test(u.name || u.description || "")
        );
        const isTimeField = unitOptions.some((u: any) =>
          /^hh:mm$/i.test(u.name || u.description || "")
        );
        const isDateTimeField = unitOptions.some((u: any) =>
          /hh:mm|date time|datetime/i.test(u.name || u.description || "")
        );
        const isTextUnit = unitOptions.length === 1 &&
          unitOptions[0].name?.toLowerCase() === "text";

        const isQuantityEmpty = quantity === "" || quantity === undefined || isNaN(Number(quantity));

        if (isDateField || isTimeField || isDateTimeField) {
          if (!value) invalidFields.push(label);
        } else if (isTextUnit) {
          if (!value) invalidFields.push(label);
        } else {
          if (unitOptions.length > 1) {
            // need BOTH quantity and unit selection
            if (isQuantityEmpty || !value) {
              invalidFields.push(label);
            }
          } else if (unitOptions.length === 1) {
            // need just quantity
            if (isQuantityEmpty) {
              invalidFields.push(label);
            }
          }
        }
        return;
      }

      if (isSearch && !selectedSearchItem) {
        invalidFields.push(label);
        return;
      }

      // Handle category fields
      if (isCategory && !value) {
        invalidFields.push(label);
        return;
      }

      // // Default case for other required fields
      if (!value && !quantities[index]) {
        if (!(label.toLowerCase().includes("subspace"))) {
          invalidFields.push(label);
        }
      }


    });

    if (invalidFields.length > 0) {
      toast.error(
        `Please fill all required fields: ${invalidFields.join(", ")}`,
        { duration: 4000 }
      );
      setLoading(false);
      return;
    }
    try {
      const event_time = new Date().toISOString().slice(0, 19);

      // 🟨 Define flags for special a_ids
      const specialAids: Record<number, string> = {
        25: "PH",
        28: "PH",  // task metadata
        29: "PH",  // Build task
        30: "PT",  // Add action
        31: "PT",  // Weekly action
        32: "PT",  // Monthly action
        33: "PT",  // Add event
      };

      const isSpecial = Object.keys(specialAids).map(Number).includes(a_id);
      const flag = isSpecial ? specialAids[a_id] : "PN";

      // 🔁 Override at_id if flag is "PT"
      const finalAtId = (isSpecial) ? 302 : at_id;
      const payload: any = {
        a_id,
        at_id: finalAtId,
        flag: isSpecial ? specialAids[a_id] : "PH",
        trigger,
        is_active: isSpecial ? "Y" : true,
        user_id: userId,
        event_time,
        description: selectedTaskDetails?.task_name || selectedSearchItem?.name || trigger,
        cat_qty_id1: (isSpecial && a_id != 33) ? selectedTaskDetails?.task_id : (a_id == 33 ? selectedTaskDetails?.collective_id : collectiveId),
        value1: "",
        value2: "",
        value3: "",
        value4: "",
        value5: "",
        value6: "",
        cat_qty_id2: 0,
        cat_qty_id3: 0,
        cat_qty_id4: 0,
        cat_qty_id5: 0,
        cat_qty_id6: 0,
        by_datetime_value: "",
      };

      for (let i = 1; i <= 6; i++) {
        const itemList = template[`item_id${i}`];
        const selected = values[i];

        if (!itemList || itemList.length === 0) continue;

        const itemType = itemList[0].item_type?.toLowerCase() || "";

        const unitOptions = itemList.filter((x: any) => x.unit_id);
        const isTextUnit = unitOptions.length === 1 && unitOptions[0].name?.toLowerCase() === "text";

        const isDateTimeField = unitOptions.some((u: any) =>
          /hh:mm|date time|datetime/i.test(u.name || u.description || "")
        );

        const isDateField = unitOptions.some((u: any) =>
          /date|mm\/dd\/yyyy|dd\/mm\/yyyy/i.test(u.name || u.description || "")
        );

        const isTimeField = unitOptions.some((u: any) =>
          /^hh:mm$/i.test(u.name || u.description || "")
        );


        if (i === 2 && isDateField) {
          const isoDate = selected || "";
          const formattedDate = isoDate
            ? `${isoDate.split("-")[2]}/${isoDate.split("-")[1]}/${isoDate.split("-")[0]}`
            : "";

          payload[`value2`] = formattedDate;
          payload[`cat_qty_id2`] = 47;
        } else if (itemType.includes("unit")) {
          if (isTimeField && selected) {
            // time-only field (HH:mm)
            payload[`value${i}`] = selected; // example: "14:30"
          } else if (isDateTimeField && selected) {
            // datetime-local (2025-06-30T14:30)
            // const [datePart, timePart] = selected.split("T");
            // const [yyyy, mm, dd] = datePart.split("-");
            // const formatted = `${mm}/${dd}/${yyyy} ${timePart}`;
            payload[`value${i}`] = selected;
          }
          else if (isDateField && selected) {
            // fallback date
            const [yyyy, mm, dd] = selected.split("-");
            payload[`value${i}`] = `${dd}/${mm}/${yyyy}`;
          } else {
            payload[`value${i}`] = isTextUnit
              ? values[i] || ""
              : quantities[i] || "";
          }

          // Set cat_qty_id
          payload[`cat_qty_id${i}`] = unitOptions.length === 1
            ? unitOptions[0].unit_id
            : Number(values[i]) || 0;
        } else if (itemType.includes("category")) {
          payload[`cat_qty_id${i}`] = Number(selected) || 0;
          payload[`value${i}`] = ""; // optional but safe
        } else if (itemType.includes("search") || itemType.includes("text")) {
          payload[`value${i}`] = selected || "";
        } else {
          payload[`value${i}`] = selected || "";
        }
      }

      // 🔧 Minimal adjustments for special a_ids
      // Override fields for special MWB a_ids
      if (a_id === 25) {
        payload.cat_qty_id1 = selectedGoalDetails?.goalId || 0;
        payload.at_id = 301;
      }
      if (a_id === 30) {
        // Case: Single DateTime (e.g., Add Action)
        payload.action_timestamp = event_time;
        payload.by_datetime_value = values[4] || ""; // assuming item_id4 is a datetime-local field
      }

      if (a_id === 31) {
        const selectedDayCatId = Number(values[4]); // Day dropdown (cat_id 76-82)
        const selectedTime = values[5]; // HH:mm format

        const dayNameMap: Record<number, number> = {
          76: 1, // Monday
          77: 2,
          78: 3,
          79: 4,
          80: 5,
          81: 6,
          82: 0, // Sunday
        };

        const targetDayIndex = dayNameMap[selectedDayCatId];

        if (!isNaN(targetDayIndex) && selectedTime) {
          const now = new Date();
          const currentDay = now.getDay();
          const daysUntilTarget = (targetDayIndex + 7 - currentDay) % 7 || 7;

          const targetDate = new Date();
          targetDate.setDate(now.getDate() + daysUntilTarget);

          // Set hours and minutes from selected time
          const [hourStr, minStr] = selectedTime.split(":");
          const hour = parseInt(hourStr, 10);
          const minute = parseInt(minStr, 10);

          if (!isNaN(hour) && !isNaN(minute)) {
            targetDate.setHours(hour);
            targetDate.setMinutes(minute);
            targetDate.setSeconds(0);
            targetDate.setMilliseconds(0);

            payload.by_datetime_value = targetDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
            payload.action_timestamp = event_time;

          } else {
            console.error("Invalid time format for weekly recurrence.");
          }
        } else {
          console.error("Missing or invalid day/time selection for weekly recurrence.");
        }
      }

      if (a_id === 32) {
        const selectedDay = Number(quantities[4]); // day of month from unit input
        const selectedTime = values[5]; // time input (HH:mm)

        // console.log("📅 Monthly selectedDay:", selectedDay);
        // console.log("🕒 Monthly selectedTime:", selectedTime);

        if (selectedDay && selectedTime && /^\d{2}:\d{2}$/.test(selectedTime)) {
          const now = new Date();
          let targetMonth = now.getMonth();
          let targetYear = now.getFullYear();

          if (selectedDay <= now.getDate()) {
            // Move to next month if day has already passed
            targetMonth += 1;
            if (targetMonth > 11) {
              targetMonth = 0;
              targetYear += 1;
            }
          }

          const targetDate = new Date(targetYear, targetMonth, selectedDay);
          const [hourStr, minuteStr] = selectedTime.split(":");
          const hour = parseInt(hourStr, 10);
          const minute = parseInt(minuteStr, 10);

          if (!isNaN(hour) && !isNaN(minute)) {
            targetDate.setHours(hour, minute, 0, 0);
            const yyyy = targetDate.getFullYear();
            const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
            const dd = String(targetDate.getDate()).padStart(2, "0");
            const hh = String(targetDate.getHours()).padStart(2, "0");
            const min = String(targetDate.getMinutes()).padStart(2, "0");

            payload.by_datetime_value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
            payload.action_timestamp = event_time;

          } else {
            console.error("⛔ Invalid time format in monthly recurrence");
          }
        } else {
          console.error("⛔ Missing or invalid input for monthly recurrence");
        }
      }

      // ⬇️ Only override if subspace was selected
      if (selectedSubspace) {
        payload.cat_qty_id5 = selectedSubspace.subspace_id;
        payload.value5 = selectedSubspace.name;
      }
      if (a_id === 9) {
        payload.flag = "PN";
      }
      // 📡 Choose correct endpoint
      let endpoint = (isSpecial && (a_id === 28 || a_id === 25))
        ? "https://meseer.com/dog/user_activity_insert"
        : "https://meseer.com/dog//add-data/primary-mwb/";

      if (!isSpecial) {
        endpoint = "https://meseer.com/dog/user_activity_insert";
      }
      // console.log(payload);
      await fetch(endpoint, {
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