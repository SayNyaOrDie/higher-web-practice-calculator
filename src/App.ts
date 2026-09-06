import { format } from 'date-fns';

import { budgetSchema, startFormDataSchema, transactionDraftSchema } from './models/schemas';
import { initBalancePage, renderBalancePage } from './pages/balance-page';
import { initHistoryPage, renderHistoryPage } from './pages/history-page';
import { initMainPage, renderMainPage } from './pages/main-page';
import { initStartPage, renderStartPage } from './pages/start-page';
import { getNextInitialBalance } from './services/budget-calculator';
import {
  addTransaction,
  clearTransactions,
  deleteTransaction,
  loadBudget,
  loadTransactions,
  saveBudget,
  toBudget,
} from './utils/db';
import { createStore } from './utils/state';

import type { Budget, Transaction } from './models/schemas';

type AppView = 'start' | 'main' | 'history' | 'balance';

interface AppState {
  budget: Budget | null;
  transactions: Transaction[];
  view: AppView;
}

export function initApp(): void {
  const root = document.querySelector('#app');

  if (!root) {
    return;
  }

  const store = createStore<AppState>({
    budget: null,
    transactions: [],
    view: 'start',
  });

  const today = (): string => format(new Date(), 'yyyy-MM-dd');

  const loadIntoStore = async (nextView?: AppView): Promise<void> => {
    const budget = await loadBudget();
    const transactions = await loadTransactions();
    const currentView = nextView ?? store.getState().view;

    store.setState({
      budget,
      transactions,
      view: budget ? (currentView === 'start' ? 'main' : currentView) : 'start',
    });
  };

  const render = (state: AppState): void => {
    const { view, budget, transactions } = state;

    if (view === 'main' && budget) {
      root.innerHTML = renderMainPage(budget, transactions);
      initMainPage(root, {
        onEdit: () => {
          store.setState({ view: 'balance' });
        },
        onHistory: () => {
          store.setState({ view: 'history' });
        },
        onAddExpense: amount => {
          void (async () => {
            await addTransaction(
              transactionDraftSchema.parse({
                amount,
                date: today(),
                type: 'expense',
              })
            );
            await loadIntoStore();
          })();
        },
      });
      return;
    }

    if (view === 'balance' && budget) {
      const currentBudget = budget;
      root.innerHTML = renderBalancePage(currentBudget, transactions);
      initBalancePage(root, currentBudget, transactions, {
        onCancel: () => {
          store.setState({ view: 'main' });
        },
        onSave: (remaining, topUp, endDate) => {
          void (async () => {
            const nextBudget = budgetSchema.parse({
              ...currentBudget,
              endDate,
              initialBalance: getNextInitialBalance(
                currentBudget.initialBalance,
                remaining,
                transactions
              ),
            });

            await saveBudget(nextBudget);

            if (topUp > 0) {
              await addTransaction(
                transactionDraftSchema.parse({
                  amount: topUp,
                  date: today(),
                  type: 'income',
                })
              );
            }

            await loadIntoStore('main');
          })();
        },
      });
      return;
    }

    if (view === 'history' && budget) {
      root.innerHTML = renderHistoryPage(budget, transactions);
      initHistoryPage(root, {
        onBack: () => {
          store.setState({ view: 'main' });
        },
        onDelete: id => {
          void (async () => {
            await deleteTransaction(id);
            await loadIntoStore();
          })();
        },
      });
      return;
    }

    root.innerHTML = renderStartPage();
    initStartPage(root, {
      onCalculate: data => {
        void (async () => {
          const nextBudget = toBudget(startFormDataSchema.parse(data));

          await saveBudget(nextBudget);
          await clearTransactions();
          await loadIntoStore('main');
        })();
      },
    });
  };

  store.subscribe(render);

  void (async () => {
    try {
      await loadIntoStore();
    } catch {
      store.setState({
        budget: null,
        transactions: [],
        view: 'start',
      });
    }
  })();
}
