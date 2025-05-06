
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { BalanceStrategy } from './BalanceStrategySelector';
import { methodDescriptions } from './MethodDescriptions';

export type UndersamplingMethod = 'random' | 'enn' | 'tomek' | 'ncr';
export type OversamplingMethod = 'random' | 'smote' | 'borderline_smote' | 'adasyn' | 'smotenc';
export type BalanceMethod = UndersamplingMethod | OversamplingMethod | 'none';

interface FeatureTypes {
  hasNumerical: boolean;
  hasCategorical: boolean;
  isMixed: boolean;
}

interface BalanceMethodSelectorProps {
  balanceStrategy: BalanceStrategy;
  balanceMethod: BalanceMethod;
  onChange: (value: BalanceMethod) => void;
  featureTypes: FeatureTypes;
  isClassification: boolean;
  isLoading: boolean;
}

const BalanceMethodSelector: React.FC<BalanceMethodSelectorProps> = ({
  balanceStrategy,
  balanceMethod,
  onChange,
  featureTypes,
  isClassification,
  isLoading
}) => {
  // Balance method options based on strategy
  const getBalanceMethodOptions = () => {
    if (balanceStrategy === 'undersample') {
      return (
        <>
          {/* Random Undersampling - always enabled */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="random">
                Random Undersampling
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.random_under.name}</h5>
                <p className="text-sm">{methodDescriptions.random_under.tooltip}</p>
                <div className="bg-green-50 border border-green-100 rounded p-1 mt-1">
                  <span className="text-xs text-green-700">Works with any data types</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* ENN method - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="enn" disabled={!featureTypes.hasNumerical}>
                ENN (Edited Nearest Neighbors)
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.enn.name}</h5>
                <p className="text-sm">{methodDescriptions.enn.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* Tomek Links method - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="tomek" disabled={!featureTypes.hasNumerical}>
                Tomek Links
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.tomek.name}</h5>
                <p className="text-sm">{methodDescriptions.tomek.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* NCR method - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="ncr" disabled={!featureTypes.hasNumerical}>
                NCR (Neighborhood Cleaning Rule)
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.ncr.name}</h5>
                <p className="text-sm">{methodDescriptions.ncr.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </>
      );
    } else if (balanceStrategy === 'oversample') {
      return (
        <>
          {/* Random Oversampling - always enabled */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="random">
                Random Oversampling
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.random_over.name}</h5>
                <p className="text-sm">{methodDescriptions.random_over.tooltip}</p>
                <div className="bg-green-50 border border-green-100 rounded p-1 mt-1">
                  <span className="text-xs text-green-700">Works with any data types</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* SMOTE - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="smote" disabled={!featureTypes.hasNumerical}>
                SMOTE
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.smote.name}</h5>
                <p className="text-sm">{methodDescriptions.smote.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* Borderline SMOTE - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="borderline_smote" disabled={!featureTypes.hasNumerical}>
                Borderline SMOTE
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.borderline_smote.name}</h5>
                <p className="text-sm">{methodDescriptions.borderline_smote.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* ADASYN - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="adasyn" disabled={!featureTypes.hasNumerical}>
                ADASYN
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.adasyn.name}</h5>
                <p className="text-sm">{methodDescriptions.adasyn.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* SMOTENC - requires mixed features (numerical and categorical) */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="smotenc" disabled={!featureTypes.isMixed}>
                SMOTENC
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.smotenc.name}</h5>
                <p className="text-sm">{methodDescriptions.smotenc.tooltip}</p>
                <div className="bg-cyan-50 border border-cyan-100 rounded p-1 mt-1">
                  <span className="text-xs text-cyan-700">Requires both categorical and numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </>
      );
    }
    return null;
  };

  // Get tooltip and style for selected method
  const getSelectedMethodInfo = () => {
    // Fix the type comparison issue by comparing string values explicitly
    if (balanceStrategy === 'skip' || balanceMethod === 'none') {
      return {
        tooltip: "No class balancing will be applied",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-100",
        textColor: "text-gray-700"
      };
    }
    
    let methodKey = '';
    if (balanceStrategy === 'undersample') {
      methodKey = balanceMethod === 'random' ? 'random_under' : balanceMethod;
    } else if (balanceStrategy === 'oversample') {
      methodKey = balanceMethod === 'random' ? 'random_over' : balanceMethod;
    }
    
    let bgColor = "bg-amber-50";
    let borderColor = "border-amber-100";
    let textColor = "text-amber-800";
    
    if (methodKey === 'random_under' || methodKey === 'random_over') {
      bgColor = "bg-green-50";
      borderColor = "border-green-100";
      textColor = "text-green-800";
    } else if (methodKey === 'smotenc') {
      bgColor = "bg-cyan-50";
      borderColor = "border-cyan-100";
      textColor = "text-cyan-700";
    }
    
    return {
      tooltip: methodDescriptions[methodKey]?.tooltip || "No description available",
      bgColor,
      borderColor,
      textColor
    };
  };

  const methodInfo = getSelectedMethodInfo();

  // Don't render if not applicable
  if (!isClassification || balanceStrategy === 'skip') {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="font-medium mb-2 text-sm">Balancing Method</h4>
      <div className="relative">
        <Select
          value={balanceMethod}
          onValueChange={(value) => onChange(value as BalanceMethod)}
          disabled={!isClassification || isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select balancing method" />
          </SelectTrigger>
          <SelectContent className="relative z-50">
            {getBalanceMethodOptions()}
          </SelectContent>
        </Select>
        
        {/* Method information section */}
        {balanceMethod !== 'none' && (
          <div className="text-xs mt-2 space-y-1">
            <div className={`px-3 py-2 rounded ${methodInfo.bgColor} ${methodInfo.borderColor} ${methodInfo.textColor}`}>
              {methodInfo.tooltip}
            </div>
            
            {/* Keep error messages for incompatible methods */}
            {balanceStrategy === 'undersample' && balanceMethod !== 'random' && !featureTypes.hasNumerical && (
              <p className="text-amber-500 mt-1 px-1">This method requires numerical features which are not present in your selected columns.</p>
            )}
            {balanceStrategy === 'oversample' && balanceMethod !== 'random' && balanceMethod !== 'smotenc' && !featureTypes.hasNumerical && (
              <p className="text-amber-500 mt-1 px-1">This method requires numerical features which are not present in your selected columns.</p>
            )}
            {balanceStrategy === 'oversample' && balanceMethod === 'smotenc' && !featureTypes.isMixed && (
              <p className="text-amber-500 mt-1 px-1">SMOTENC requires both numerical and categorical features.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceMethodSelector;
