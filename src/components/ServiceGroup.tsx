import React from 'react';
import ServiceButton from './ServiceButton';

interface ServiceGroupProps {
  groupName: string;
  services: string[];
}

const ServiceGroup: React.FC<ServiceGroupProps> = ({ groupName, services }) => {
  return (
    <div className="button-group" data-group={groupName}>
      <div className="group-header" role="heading" aria-level={3}>
        {groupName}
      </div>
      <div className="group-grid" role="group" aria-label={`${groupName} services`}>
        {services?.map(service => (
          <ServiceButton key={service} serviceName={service} />
        )) || null}
      </div>
    </div>
  );
};

export default ServiceGroup;