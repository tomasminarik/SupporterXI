'use client';
import { useState } from 'react';
import { CloseButton } from '../../design/button';
import { OptionList } from '../../design/option-list';
import { Tile } from '../../design/tile';

// Live examples for /gameplan. They hold their own state and change nothing else.
const choices = [
  { value: '', label: 'No choice' },
  { value: 'first', label: 'First choice', description: 'A line that says what choosing this means.' },
  { value: 'second', label: 'Second choice', description: 'Each choice explains itself, so there is no second step.' },
];

export function PanelDemo() {
  const [value, setValue] = useState('first');
  return <div className="sx-panel gp-panel" role="group" aria-labelledby="gp-panel-title">
    <div className="gp-panel-head"><h3 id="gp-panel-title">Panel title</h3><CloseButton label="Close (example)" /></div>
    <OptionList name="gp-option" label={<>Choice <span>optional</span></>} options={choices} value={value} onChange={setValue} />
  </div>;
}

export function TileDemo() {
  const [pressed, setPressed] = useState('4-3-3');
  return <div className="gp-tiles" role="group" aria-label="Example tiles">
    {['4-4-2', '4-3-3', '3-5-2'].map((name) => <Tile key={name} className="gp-tile-demo" pressed={pressed === name} onClick={() => setPressed(name)}>{name}</Tile>)}
  </div>;
}
