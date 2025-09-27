import React, { useMemo } from "react";
import { awsServices, groupOrder } from "../types/aws";
import ServiceGroup from "./ServiceGroup";

const Palette: React.FC = () => {
  // Group services by buttonGroup - memoized for performance
  const groupedServices = useMemo(() => {
    const grouped: { [key: string]: string[] } = {};

    for (const serviceKey of Object.keys(awsServices)) {
      const service = awsServices[serviceKey];
      if (!service) continue; // Type safety check

      const group = service.buttonGroup || "others";
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(serviceKey);
    }

    return grouped;
  }, []);

  return (
    <aside className="palette" aria-label="Icon Palette" role="complementary">
      <div className="palette-grid" role="region" aria-label="AWS Service Selection">
        {groupOrder.map(group => {
          if (!groupedServices[group] || groupedServices[group].length === 0) {
            return null;
          }

          return (
            <ServiceGroup
              key={group}
              groupName={group}
              services={groupedServices[group]}
            />
          );
        })}
      </div>
    </aside>
  );
};

export default Palette;
