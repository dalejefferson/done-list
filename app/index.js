import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { backend } from '../src/services/backend-native';

// API Base URL configuration - always use localhost for local storage
// Android emulator uses 10.0.2.2 to access host localhost
// iOS Simulator uses localhost directly
const getApiBase = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001'; // Android emulator maps 10.0.2.2 to host localhost
  }
  
  return 'http://localhost:3001'; // iOS Simulator and local development
};

const API_BASE = getApiBase();

// Color constants matching the design
const colors = {
  base: {
    900: '#1A2F30',
    800: '#243A3B',
    700: '#2F4A4B',
  },
  accent: {
    500: '#5A8A8C',
    600: '#4A7C7E',
  },
  peach: {
    500: '#D4A574',
    600: '#C89A6A',
  },
  cream: {
    50: '#F8F4F0',
    100: '#F5F0E8',
  },
};

export default function HomeScreen() {
  const [todos, setTodos] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [collapsedTodos, setCollapsedTodos] = useState(new Set());
  const [manuallyExpandedTodos, setManuallyExpandedTodos] = useState(new Set());
  const [aiSteps, setAiSteps] = useState([]);
  const [aiStatus, setAiStatus] = useState('');
  const [aiRequestInFlight, setAiRequestInFlight] = useState(false);
  const [currentAnalyzedTask, setCurrentAnalyzedTask] = useState(null);
  const [currentAnalyzedTodoId, setCurrentAnalyzedTodoId] = useState(null);
  const [previousTodoId, setPreviousTodoId] = useState(null);

  const loadTodos = useCallback(async () => {
    const loadedTodos = await backend.listTodos();
    setTodos(loadedTodos);
    
    // Collapse tasks with subtasks by default
    loadedTodos.forEach(todo => {
      if (todo.subTasks && todo.subTasks.length > 0) {
        if (!manuallyExpandedTodos.has(todo.id)) {
          setCollapsedTodos(prev => new Set(prev).add(todo.id));
        }
      }
    });
  }, [manuallyExpandedTodos]);

  useEffect(() => {
    loadTodos();
  }, []);

  const addTodo = async () => {
    if (!inputText.trim()) return;
    
    // Collapse the previous task if it exists
    if (previousTodoId) {
      const previousTodo = todos.find(t => t.id === previousTodoId);
      if (previousTodo && !manuallyExpandedTodos.has(previousTodoId)) {
        setCollapsedTodos(prev => new Set(prev).add(previousTodoId));
      }
    }
    
    const newTodo = await backend.createTodo(inputText.trim());
    if (newTodo) {
      setInputText('');
      setPreviousTodoId(newTodo.id);
      await loadTodos();
      analyzeTaskWithAI(newTodo.title, newTodo.id).catch(() => {});
    }
  };

  const toggleTodo = async (id) => {
    await backend.toggleTodo(id);
    await loadTodos();
  };

  const toggleEveryday = async (id) => {
    await backend.toggleEveryday(id);
    await loadTodos();
  };

  const deleteTodo = async (id) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await backend.deleteTodo(id);
            await loadTodos();
          },
        },
      ]
    );
  };

  const toggleSubTask = async (todoId, subTaskId) => {
    await backend.toggleSubTask(todoId, subTaskId);
    await loadTodos();
    
    const todo = todos.find(t => t.id === todoId);
    if (todo && todo.subTasks && todo.subTasks.length > 0) {
      const allSubTasksCompleted = todo.subTasks.every(st => st.completed);
      if (allSubTasksCompleted && !todo.completed) {
        await backend.toggleTodo(todoId);
        await loadTodos();
      }
    }
  };

  const clearCompleted = async () => {
    Alert.alert(
      'Clear Completed',
      'Are you sure you want to clear all completed tasks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            await backend.clearCompleted();
            await loadTodos();
          },
        },
      ]
    );
  };

  const toggleCollapse = (todoId) => {
    setCollapsedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(todoId)) {
        newSet.delete(todoId);
        setManuallyExpandedTodos(prevExp => new Set(prevExp).add(todoId));
      } else {
        newSet.add(todoId);
        setManuallyExpandedTodos(prevExp => {
          const newExp = new Set(prevExp);
          newExp.delete(todoId);
          return newExp;
        });
      }
      return newSet;
    });
  };

  const assignDateToTodo = async (todoId) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    
    // For React Native, we'll use a simple text input approach
    // Note: Alert.prompt is iOS only, so we'll show an Alert with instructions
    // In a production app, you'd want to use a proper date picker library
    const currentDate = todo.assignedDate || new Date().toISOString().split('T')[0];
    
    Alert.alert(
      'Assign Date',
      `Current date: ${currentDate}\n\nTo assign a date, you can edit this feature to use a date picker component.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Date',
          onPress: async () => {
            await backend.updateTodo(todoId, { assignedDate: undefined });
            await loadTodos();
          },
        },
      ]
    );
  };

  const analyzeTaskWithAI = async (taskText, todoId, isRegenerate = false) => {
    const trimmed = String(taskText || '').trim();
    if (!trimmed || !todoId || aiRequestInFlight) return;
    
    setAiRequestInFlight(true);
    if (!isRegenerate) {
      setCurrentAnalyzedTask(trimmed);
      setCurrentAnalyzedTodoId(todoId);
    }
    
    setAiStatus(isRegenerate ? 'Generating better version…' : 'Analyzing…');
    setAiSteps([]);
    
    try {
      const res = await fetch(`${API_BASE}/api/ai/analyze-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskText: trimmed,
          regenerate: isRegenerate,
          context: isRegenerate ? { previousAnalysis: true } : undefined
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.details || errorData?.error || `Request failed (${res.status})`);
      }
      
      // Check if response is streaming (text/event-stream) or regular JSON
      const contentType = res.headers.get('content-type') || '';
      let json = null;
      
      if (contentType.includes('text/event-stream')) {
        // Handle streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'chunk') {
                  fullText += data.content;
                  setAiStatus('Generating suggestions…');
                } else if (data.type === 'complete') {
                  json = data;
                  break;
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'AI analysis failed');
                }
              } catch (e) {
                // Skip malformed JSON lines
              }
            }
          }
          
          if (json) break;
        }
        
        if (!json) {
          // Try to parse accumulated text as JSON
          try {
            const match = fullText.match(/\{[\s\S]*\}$/);
            if (match) {
              json = { result: JSON.parse(match[0]) };
            } else {
              throw new Error('Invalid response from AI');
            }
          } catch (e) {
            throw new Error('Failed to parse AI response');
          }
        }
      } else {
        // Fallback to regular JSON response
        json = await res.json();
      }
      
      // Save the full AI analysis response to the database
      const fullAnalysis = json?.result;
      if (fullAnalysis) {
        await backend.updateAIAnalysis(todoId, fullAnalysis);
      }
      
      const steps = json?.result?.steps || [];
      
      if (steps.length > 0) {
        const subTasks = steps.map((step, idx) => ({
          id: `sub-${todoId}-${idx}-${Date.now()}`,
          title: step.title || `Step ${idx + 1}`,
          completed: false
        }));
        
        if (isRegenerate) {
          await backend.replaceSubTasks(todoId, subTasks);
        } else {
          await backend.addSubTasks(todoId, subTasks);
        }
        
        // Automatically expand the task when AI suggestions create subtasks
        setCollapsedTodos(prev => {
          const newSet = new Set(prev);
          newSet.delete(todoId);
          return newSet;
        });
        setManuallyExpandedTodos(prev => new Set(prev).add(todoId));
        await loadTodos();
      }
      
      setAiSteps(steps);
      setAiStatus(isRegenerate ? 'Better version generated' : 'Sub-tasks created');
      setTimeout(() => setAiStatus(''), 1500);
    } catch (err) {
      const msg = String(err?.message || 'AI analysis failed');
      const isQuotaError = msg.includes('quota') || msg.includes('billing') || msg.includes('insufficient_quota');
      setAiStatus(isQuotaError ? 'OpenAI quota exceeded' : 'AI unavailable');
      setAiSteps([{ title: 'Error', why: msg }]);
    } finally {
      setAiRequestInFlight(false);
    }
  };

  const regenerateAI = async () => {
    if (!currentAnalyzedTask || !currentAnalyzedTodoId) return;
    await analyzeTaskWithAI(currentAnalyzedTask, currentAnalyzedTodoId, true);
  };

  const getVisibleTodos = () => {
    switch (currentFilter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  };

  const remainingCount = todos.filter(t => !t.completed).length;

  const renderTodoItem = ({ item: todo }) => {
    const isCollapsed = collapsedTodos.has(todo.id);
    const hasSubTasks = todo.subTasks && todo.subTasks.length > 0;

    return (
      <View style={styles.todoItem}>
        <View style={styles.todoRow}>
          <TouchableOpacity
            onPress={() => toggleTodo(todo.id)}
            style={[
              styles.checkbox,
              todo.completed && styles.checkboxCompleted
            ]}
          >
            {todo.completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <Text 
            style={[
              styles.todoTitle,
              todo.completed && styles.todoTitleCompleted
            ]}
          >
            {todo.title}
          </Text>

          <TouchableOpacity
            onPress={() => toggleEveryday(todo.id)}
            style={[
              styles.iconButton,
              todo.isEveryday && styles.iconButtonActive
            ]}
          >
            <Text style={styles.iconText}>{todo.isEveryday ? '🕐' : '📅'}</Text>
          </TouchableOpacity>

          {hasSubTasks && (
            <TouchableOpacity onPress={() => toggleCollapse(todo.id)}>
              <Text style={styles.collapseIcon}>
                {isCollapsed ? '▼' : '▲'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => assignDateToTodo(todo.id)}
            style={styles.smallButton}
          >
            <Text style={styles.smallButtonText}>
              {todo.assignedDate 
                ? new Date(todo.assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '📅'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => deleteTodo(todo.id)}
            style={styles.smallButton}
          >
            <Text style={styles.smallButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {hasSubTasks && !isCollapsed && (
          <View style={styles.subTasksContainer}>
            {todo.subTasks.map((subTask) => (
              <View key={subTask.id} style={styles.subTaskItem}>
                <TouchableOpacity
                  onPress={() => toggleSubTask(todo.id, subTask.id)}
                  style={[
                    styles.subCheckbox,
                    subTask.completed && styles.checkboxCompleted
                  ]}
                >
                  {subTask.completed && <Text style={styles.subCheckmark}>✓</Text>}
                </TouchableOpacity>
                <Text 
                  style={[
                    styles.subTaskTitle,
                    subTask.completed && styles.todoTitleCompleted
                  ]}
                >
                  {subTask.title}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoCheckmark}>✓</Text>
              </View>
              <Text style={styles.logoText}>Done List</Text>
            </View>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Done List</Text>
          <Text style={styles.heroSubtitle}>
            A sleek task list with a smooth calm UI and accent highlights.
          </Text>
        </View>

        {/* Main App Card */}
        <View style={styles.mainContent}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your Tasks</Text>
              <TouchableOpacity onPress={clearCompleted}>
                <Text style={styles.clearButton}>Clear completed</Text>
              </TouchableOpacity>
            </View>

            {/* Input Form */}
            <View style={styles.inputRow}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={addTodo}
                placeholder="Write a task and press Enter..."
                placeholderTextColor={colors.base[900] + '80'}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={addTodo}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Todo List */}
            {getVisibleTodos().length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No tasks yet. Add one above!
                </Text>
              </View>
            ) : (
              <FlatList
                data={getVisibleTodos()}
                renderItem={renderTodoItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}

            {/* Controls */}
            <View style={styles.controls}>
              <Text style={styles.countText}>
                {remainingCount} {remainingCount === 1 ? 'item' : 'items'} left
              </Text>
              <View style={styles.filterRow}>
                {['all', 'active', 'completed'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => setCurrentFilter(filter)}
                    style={[
                      styles.filterButton,
                      currentFilter === filter && styles.filterButtonActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        currentFilter === filter && styles.filterButtonTextActive
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* AI Suggestions */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>AI Suggestions</Text>
              <View style={styles.aiHeaderRow}>
                {aiSteps.length > 0 && (
                  <TouchableOpacity
                    onPress={regenerateAI}
                    style={styles.regenerateButton}
                  >
                    <Text style={styles.regenerateButtonText}>Regenerate</Text>
                  </TouchableOpacity>
                )}
                {aiStatus ? (
                  <Text style={styles.aiStatus}>{aiStatus}</Text>
                ) : null}
              </View>
            </View>
            <ScrollView style={styles.aiContainer} nestedScrollEnabled>
              {aiSteps.length === 0 ? (
                <Text style={styles.emptyAiText}>
                  No suggestions yet. Add a task to get AI-powered breakdown suggestions!
                </Text>
              ) : (
                aiSteps.map((step, idx) => (
                  <View key={idx} style={styles.aiStep}>
                    <Text style={styles.aiStepTitle}>
                      {idx + 1}. {step?.title || 'Untitled step'}
                    </Text>
                    {step?.why && (
                      <Text style={styles.aiStepWhy}>
                        {step.why}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(248, 244, 240, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent[500] + '26',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    height: 24,
    width: 24,
    borderRadius: 6,
    backgroundColor: colors.cream[50],
    borderWidth: 2,
    borderColor: colors.accent[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoCheckmark: {
    color: colors.accent[500],
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: colors.base[900],
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.base[900],
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: colors.base[900] + 'B3',
    textAlign: 'center',
    marginBottom: 24,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(248, 244, 240, 0.4)',
    borderWidth: 1,
    borderColor: colors.accent[500] + '33',
    padding: 24,
    marginBottom: 24,
    shadowColor: colors.accent[500],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.base[900],
  },
  clearButton: {
    fontSize: 12,
    color: colors.base[900] + '99',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.cream[50],
    borderWidth: 1,
    borderColor: colors.accent[500] + '4D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.base[900],
  },
  addButton: {
    borderRadius: 12,
    backgroundColor: colors.accent[500],
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.cream[50],
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyStateText: {
    fontSize: 12,
    color: colors.base[900] + '99',
  },
  todoItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: colors.accent[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 2,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent[500] + '4D',
    backgroundColor: colors.cream[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.accent[500],
  },
  checkmark: {
    color: colors.cream[50],
    fontSize: 12,
  },
  todoTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.accent[500],
    textAlign: 'center',
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.base[900] + '80',
  },
  iconButton: {
    height: 20,
    width: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent[500] + '4D',
    backgroundColor: colors.cream[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: colors.peach[500],
  },
  iconText: {
    fontSize: 10,
  },
  collapseIcon: {
    color: colors.base[900] + '99',
    fontSize: 14,
  },
  smallButton: {
    opacity: 0.7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.accent[500] + '33',
  },
  smallButtonText: {
    fontSize: 12,
    color: colors.base[900] + '99',
  },
  subTasksContainer: {
    marginTop: 12,
    marginLeft: 32,
    gap: 8,
  },
  subTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  subCheckbox: {
    height: 16,
    width: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent[500] + '4D',
    backgroundColor: colors.cream[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCheckmark: {
    color: colors.cream[50],
    fontSize: 10,
  },
  subTaskTitle: {
    flex: 1,
    fontSize: 12,
    color: colors.base[900] + 'CC',
    textAlign: 'center',
  },
  controls: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: {
    fontSize: 12,
    color: colors.base[900] + '99',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.accent[500] + '33',
  },
  filterButtonActive: {
    backgroundColor: colors.accent[500],
  },
  filterButtonText: {
    fontSize: 12,
    textTransform: 'capitalize',
    color: colors.base[900] + 'B3',
  },
  filterButtonTextActive: {
    color: colors.cream[50],
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regenerateButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.accent[500] + '1A',
  },
  regenerateButtonText: {
    fontSize: 12,
    color: colors.accent[600],
    fontWeight: 'bold',
  },
  aiStatus: {
    fontSize: 12,
    color: colors.base[900] + '99',
  },
  aiContainer: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    maxHeight: 256,
  },
  emptyAiText: {
    fontSize: 14,
    color: colors.base[900] + '99',
    textAlign: 'center',
    paddingVertical: 24,
  },
  aiStep: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: colors.accent[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 1,
  },
  aiStepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.base[900],
  },
  aiStepWhy: {
    marginTop: 8,
    fontSize: 14,
    color: colors.base[900] + '99',
    lineHeight: 20,
  },
});
