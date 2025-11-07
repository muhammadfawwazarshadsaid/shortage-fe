"use client";

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDown, EyeOff } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import React from "react";

type NullString = {
  String: string;
  Valid: boolean;
};

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {

  const getDisplayValue = (val: unknown): string => {
    if (val === null || val === undefined) {
      return "(Kosong)";
    }
    if (typeof val === 'object' && val !== null && 'Valid' in val && 'String' in val) {
      const nullString = val as NullString;
      return nullString.Valid ? nullString.String : "(Kosong)";
    }
    return String(val);
  };

  const getKey = (val: unknown): string => {
    if (val === null) {
      return "__null_key__";
    }
    if (val === undefined) {
      return "__undefined_key__";
    }
    if (typeof val === 'object' && val !== null && 'Valid' in val && 'String' in val) {
      const nullString = val as NullString;
      return `nullstring_${nullString.Valid}_${nullString.String}`; 
    }
    return String(val);
  };
  

  const facetedValuesMap = column.getFacetedUniqueValues();
  const uniqueValues = facetedValuesMap
    ? Array.from(facetedValuesMap.keys()).sort()
    : [];

  const currentFilterValues = (column.getFilterValue() || []) as unknown[];

  const valueMap = React.useMemo(() => {
    const map = new Map<string, unknown>();
    uniqueValues.forEach(value => {
      map.set(getKey(value), value); 
    });
    return map;
  }, [uniqueValues]); 

  const selectedKeys = new Set(currentFilterValues.map(getKey)); 

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      
      {column.getCanFilter() ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
              <span>{title}</span>
              {selectedKeys.size > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                  {selectedKeys.size}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Filter ${title}...`} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {uniqueValues.map((value) => { 
                    const displayValue = getDisplayValue(value);
                    const key = getKey(value); 
                    const isSelected = selectedKeys.has(key); 
                    return (
                      <CommandItem
                        key={key} 
                        onSelect={() => {
                          if (isSelected) {
                            selectedKeys.delete(key);
                          } else {
                            selectedKeys.add(key);
                          }
                          
                          const filterValues = Array.from(selectedKeys)
                            .map(k => valueMap.get(k))
                            .filter(v => v !== undefined); 

                          column.setFilterValue(filterValues.length ? filterValues : undefined);
                        }}
                      >
                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                          <Check className={cn("h-4 w-4")} />
                        </div>
                        <span>{displayValue}</span> 
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {selectedKeys.size > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem onSelect={() => column.setFilterValue(undefined)} className="justify-center text-center">
                        Clear filters
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <div className={cn(className, "pl-1")}>{title}</div>
      )}

      {column.getCanSort() && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
              <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" /> Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" /> Desc
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" /> Hide
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}