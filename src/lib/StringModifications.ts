import Position from './Position';
import { spawnUnknownSwitchCaseError } from './util';

enum ModificationType {
  Remove = 'remove',
  Insert = 'insert',
}

interface InsertModification {
  type: ModificationType.Insert;
  startPosition: Position;
  inserted: string;
}

interface RemoveModification {
  type: ModificationType.Remove;
  startPosition: Position;
  removed: string;
}

export type Modification = InsertModification | RemoveModification;

export const insert = (
  startPosition: Position,
  inserted: string,
): InsertModification => ({
  type: ModificationType.Insert,
  startPosition,
  inserted,
});

export const remove = (
  startPosition: Position,
  removed: string,
): RemoveModification => ({
  type: ModificationType.Remove,
  startPosition,
  removed,
});

const applyInsertModification = (
  position: Position,
  { startPosition, inserted }: InsertModification,
): Position => {
  let { offset, line, column } = position;
  const {
    offset: modStartOffset,
    line: modStartLine,
    column: modStartCol,
  } = startPosition;

  // modification doesn't apply if it comes later
  // in the string than this position
  if (offset <= modStartOffset) return position;

  // offset increases by the inserted length, regardless of lines etc.
  offset += inserted.length;

  if (line === modStartLine) {
    // when the insert happens on the same line as the position, increase the
    // column until we get to an inserted line break. when that happens,
    // increase the line number and reset the column
    const colOffset = column - modStartCol;
    for (let i = 0; i < inserted.length; i++) {
      if (inserted[i] === '\n') {
        line++;
        column = colOffset;
      } else {
        column++;
      }
    }
  } else {
    // when the insert happens on a different line to the position, we know it
    // must be a later line from the check above. incease the line number for
    // each newline in the inserted string, but leave column alone.
    for (let i = 0; i < inserted.length; i++) {
      if (inserted[i] === '\n') line++;
    }
  }

  return new Position(offset, line, column);
};

const getRemoveModificationEndPosition = ({
  startPosition,
  removed,
}: RemoveModification): Position => {
  let { offset, line, column } = startPosition;

  offset += removed.length;
  for (let i = 0; i < removed.length; i++) {
    if (removed[i] === '\n') {
      line++;
      column = 0;
    } else {
      column++;
    }
  }

  return new Position(offset, line, column);
};

const applyRemoveModification = (
  position: Position,
  modification: RemoveModification,
): Position => {
  const { startPosition, removed } = modification;
  let { offset, line, column } = position;
  const {
    offset: modStartOffset,
    line: modStartLine,
    column: modStartCol,
  } = startPosition;
  const {
    offset: modEndOffset,
    line: modEndLine,
    column: modEndCol,
  } = getRemoveModificationEndPosition(modification);

  // modification doesn't apply if it comes later
  // in the string than this position
  if (offset <= modStartOffset) return position;

  // if the position is inside the removed range, the new position is the
  // start of the removed range
  if (offset <= modEndOffset) return startPosition;

  // offset decreases by the removed length, regardless of lines etc.
  offset -= removed.length;

  if (line === modEndLine) {
    // when the position is on the same line as the end of the removal range,
    // adjust the line and offset the column into the right place
    line = modStartLine;
    column = modStartCol + (column - modEndCol);
  } else {
    // when the position is on a line after that of the end of the removal
    // range, reduce the line number by the number of lines removed and leave
    // columns as is
    const lineDiff = modEndLine - modStartLine;
    line -= lineDiff;
  }

  return new Position(offset, line, column);
};

export const applyModification = (
  position: Position,
  modification: Modification,
): Position => {
  switch (modification.type) {
    case ModificationType.Insert:
      return applyInsertModification(position, modification);
    case ModificationType.Remove:
      return applyRemoveModification(position, modification);
    default:
      throw spawnUnknownSwitchCaseError('Modification.type', modification);
  }
};
